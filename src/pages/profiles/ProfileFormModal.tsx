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
    FileText,
    UploadCloud,
    Trash2,
    Eye,
    Download,
    ShieldCheck,
    FileCheck,
    Hash,
    Plus
} from "lucide-react"
import profileService, { type ProfileRecord, type ProfileType, type KeyPersonnelContact } from "@/services/profile.service"
import formService from "@/services/form.service"
import { toast } from "sonner"

interface ProfileFormModalProps {
    isOpen: boolean
    onClose: () => void
    profileType: ProfileType
    editingProfile?: ProfileRecord | null
    onSuccess: () => void
}

const DOCUMENT_CATEGORIES = [
    'Aadhaar Card',
    'PAN Card',
    'GST Certificate',
    'Business Agreement',
    'Trade License',
    'Scrap License',
    'Other'
]

const formatAadhaarNumber = (val: string, prevVal: string = ""): string => {
    if (prevVal.endsWith("-") && val === prevVal.slice(0, -1)) {
        val = val.slice(0, -1);
    }
    const digits = val.replace(/\D/g, "").slice(0, 12);
    const isDeleting = val.length < prevVal.length;

    if (digits.length <= 4) {
        if (digits.length === 4 && !isDeleting) {
            return `${digits}-`;
        }
        return digits;
    } else if (digits.length <= 8) {
        if (digits.length === 8 && !isDeleting) {
            return `${digits.slice(0, 4)}-${digits.slice(4)}-`;
        }
        return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    } else {
        return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8)}`;
    }
};

export function ProfileFormModal({
    isOpen,
    onClose,
    profileType,
    editingProfile,
    onSuccess,
}: ProfileFormModalProps) {
    const isEdit = Boolean(editingProfile)
    const [activeTab, setActiveTab] = React.useState<"details" | "documents">("details")

    const emptyContact: KeyPersonnelContact = {
        name: "",
        designation: "",
        phone: "",
        alternatePhone: "",
        email: ""
    }

    // Core Fields State
    const [name, setName] = React.useState("")
    const [code, setCode] = React.useState("")
    const [keyPersonnel, setKeyPersonnel] = React.useState<KeyPersonnelContact[]>([{ ...emptyContact }])
    const [address, setAddress] = React.useState("")
    const [gstNumber, setGstNumber] = React.useState("")
    const [panNumber, setPanNumber] = React.useState("")
    const [aadhaarNumber, setAadhaarNumber] = React.useState("")
    const [licenseNumber, setLicenseNumber] = React.useState("")
    const [status, setStatus] = React.useState<"Active" | "Inactive">("Active")
    const [customFields, setCustomFields] = React.useState<Record<string, any>>({})

    const handleAddPersonnel = () => {
        setKeyPersonnel(prev => [...prev, { ...emptyContact }])
    }

    const handleRemovePersonnel = (index: number) => {
        setKeyPersonnel(prev => {
            if (prev.length <= 1) {
                return [{ ...emptyContact }]
            }
            return prev.filter((_, i) => i !== index)
        })
    }

    const handlePersonnelChange = (index: number, field: keyof KeyPersonnelContact, value: string) => {
        setKeyPersonnel(prev => {
            const updated = [...prev]
            updated[index] = { ...updated[index], [field]: value }
            return updated
        })
    }

    // Dynamic Form Schema State
    const [formDefinition, setFormDefinition] = React.useState<any>(null)
    const [loadingForm, setLoadingForm] = React.useState(false)

    // Documents State
    const [documents, setDocuments] = React.useState<any[]>([])
    const [uploadingDoc, setUploadingDoc] = React.useState(false)
    const [docTitle, setDocTitle] = React.useState("")
    const [docCategory, setDocCategory] = React.useState("Aadhaar Card")
    const [selectedFile, setSelectedFile] = React.useState<File | null>(null)

    const [saving, setSaving] = React.useState(false)

    // Get Form Schema slug based on profile type
    const formSlug = React.useMemo(() => {
        switch (profileType) {
            case "Subcontractor":
                return "subcontractor-form"
            case "ScrapDealer":
                return "scrap-dealer-form"
            case "Supplier":
                return "supplier-form"
        }
    }, [profileType])

    // Get Title & Badge per profile type
    const getProfileTypeMeta = () => {
        switch (profileType) {
            case "Subcontractor":
                return {
                    title: "Subcontractor (Vendor)",
                    color: "text-blue-600 dark:text-blue-400",
                    bgColor: "bg-blue-500/10",
                    borderColor: "border-blue-500/20"
                }
            case "ScrapDealer":
                return {
                    title: "Scrap Dealer",
                    color: "text-amber-600 dark:text-amber-400",
                    bgColor: "bg-amber-500/10",
                    borderColor: "border-amber-500/20"
                }
            case "Supplier":
                return {
                    title: "Supplier (Purchaser Name)",
                    color: "text-emerald-600 dark:text-emerald-400",
                    bgColor: "bg-emerald-500/10",
                    borderColor: "border-emerald-500/20"
                }
        }
    }

    const meta = getProfileTypeMeta()

    // Fetch dynamic form schema
    React.useEffect(() => {
        if (!isOpen) return

        const fetchFormSchema = async () => {
            setLoadingForm(true)
            try {
                const res = await formService.getFormBySlug(formSlug)
                if (res.success && res.data) {
                    setFormDefinition(res.data)
                }
            } catch (err) {
                console.error("Error fetching form schema:", err)
            } finally {
                setLoadingForm(false)
            }
        }

        fetchFormSchema()
    }, [isOpen, formSlug])

    // Load initial data
    React.useEffect(() => {
        if (!isOpen) return
        setActiveTab("details")

        if (editingProfile) {
            setName(editingProfile.name || "")
            setCode(editingProfile.code || "")
            if (editingProfile.keyPersonnel && editingProfile.keyPersonnel.length > 0) {
                setKeyPersonnel(editingProfile.keyPersonnel.map(k => ({
                    name: k.name || "",
                    designation: k.designation || "",
                    phone: k.phone || "",
                    alternatePhone: k.alternatePhone || "",
                    email: k.email || ""
                })))
            } else {
                setKeyPersonnel([{
                    name: editingProfile.contactPerson || "",
                    designation: editingProfile.contactDesignation || "",
                    phone: editingProfile.contactPhone || "",
                    alternatePhone: editingProfile.alternatePhone || "",
                    email: editingProfile.contactEmail || ""
                }])
            }
            setAddress(editingProfile.address || "")
            setGstNumber(editingProfile.gstNumber || "")
            setPanNumber(editingProfile.panNumber || "")
            setAadhaarNumber(formatAadhaarNumber(editingProfile.aadhaarNumber || ""))
            setLicenseNumber(editingProfile.licenseNumber || "")
            setStatus(editingProfile.status || "Active")
            setCustomFields(editingProfile.customFields || {})
            setDocuments(editingProfile.documents || [])
        } else {
            setName("")
            setCode("")
            setKeyPersonnel([{ ...emptyContact }])
            setAddress("")
            setGstNumber("")
            setPanNumber("")
            setAadhaarNumber("")
            setLicenseNumber("")
            setStatus("Active")
            setCustomFields({})
            setDocuments([])
        }
        setSelectedFile(null)
        setDocTitle("")
    }, [isOpen, editingProfile])

    const handleCustomFieldChange = (key: string, value: any) => {
        setCustomFields(prev => ({ ...prev, [key]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!name.trim()) {
            toast.error("Company / Person Name is required.")
            return
        }

        const primaryPhone = (keyPersonnel[0]?.phone || "").trim()
        const primaryEmail = (keyPersonnel[0]?.email || "").trim()

        if (!primaryPhone && !primaryEmail) {
            toast.error("Please provide at least a phone number or email address.")
            return
        }

        setSaving(true)
        try {
            const primaryContact = keyPersonnel[0] || emptyContact

            const payload: Partial<ProfileRecord> = {
                profileType,
                name: name.trim(),
                code: code.trim() ? code.trim().toUpperCase() : undefined,
                contactPerson: (primaryContact.name || "").trim(),
                contactDesignation: (primaryContact.designation || "").trim(),
                contactEmail: (primaryContact.email || "").trim(),
                contactPhone: (primaryContact.phone || "").trim(),
                alternatePhone: (primaryContact.alternatePhone || "").trim(),
                keyPersonnel: keyPersonnel.map(k => ({
                    name: (k.name || "").trim(),
                    designation: (k.designation || "").trim(),
                    phone: (k.phone || "").trim(),
                    alternatePhone: (k.alternatePhone || "").trim(),
                    email: (k.email || "").trim()
                })),
                address: address.trim(),
                gstNumber: gstNumber.trim().toUpperCase(),
                panNumber: panNumber.trim().toUpperCase(),
                aadhaarNumber: aadhaarNumber.trim(),
                licenseNumber: licenseNumber.trim(),
                status,
                customFields
            }

            let res
            if (isEdit && editingProfile) {
                res = await profileService.updateProfile(editingProfile._id, payload)
            } else {
                res = await profileService.createProfile(payload)
            }

            if (res.success && res.data) {
                toast.success(
                    isEdit
                        ? `${meta.title} record '${res.data.name}' updated!`
                        : `${meta.title} profile '${res.data.name}' registered successfully!`
                )

                // If new file is queued for newly created profile, upload now
                if (!isEdit && selectedFile && res.data._id) {
                    const formData = new FormData()
                    formData.append("file", selectedFile)
                    formData.append("title", docTitle || selectedFile.name)
                    formData.append("documentType", docCategory)
                    await profileService.uploadDocument(res.data._id, formData).catch(() => {})
                }

                onSuccess()
                onClose()
            } else {
                toast.error("Failed to save profile record.")
            }
        } catch (error: any) {
            const msg =
                error?.response?.data?.message ||
                error.message ||
                "An unexpected error occurred while saving profile."
            toast.error(msg)
        } finally {
            setSaving(false)
        }
    }

    const handleUploadDocumentNow = async () => {
        if (!selectedFile) {
            toast.error("Please select a file to upload.")
            return
        }

        if (!editingProfile?._id) {
            toast.info("Document will be saved when you submit the profile.")
            return
        }

        setUploadingDoc(true)
        try {
            const formData = new FormData()
            formData.append("file", selectedFile)
            formData.append("title", docTitle.trim() || selectedFile.name)
            formData.append("documentType", docCategory)

            const res = await profileService.uploadDocument(editingProfile._id, formData)
            if (res.success && res.data) {
                toast.success("Document uploaded successfully!")
                setDocuments(res.data.documents || [])
                setSelectedFile(null)
                setDocTitle("")
            } else {
                toast.error("Failed to upload document.")
            }
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Error uploading document.")
        } finally {
            setUploadingDoc(false)
        }
    }

    const handleDeleteDocNow = async (docId: string) => {
        if (!editingProfile?._id) {
            setDocuments(prev => prev.filter(d => d._id !== docId))
            return
        }

        try {
            const res = await profileService.deleteDocument(editingProfile._id, docId)
            if (res.success && res.data) {
                toast.success("Document removed successfully.")
                setDocuments(res.data.documents || [])
            }
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Error deleting document.")
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="w-[calc(100%-1rem)] sm:w-full max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-2xl">
                {/* Header */}
                <DialogHeader className="p-3.5 sm:px-6 sm:py-4 border-b border-border/60 bg-muted/20 shrink-0 pr-10 sm:pr-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                            <div className={`p-2 sm:p-2.5 rounded-xl ${meta.bgColor} ${meta.color} shrink-0`}>
                                <Building2 className="size-5 sm:size-6" />
                            </div>
                            <div className="min-w-0">
                                <DialogTitle className="text-base sm:text-xl font-bold text-foreground leading-snug">
                                    {isEdit ? `Edit ${meta.title} Record` : `Create ${meta.title} Profile`}
                                </DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground mt-0.5 leading-normal truncate sm:whitespace-normal">
                                    Manage contact profile, tax identifiers, and legal document uploads.
                                </DialogDescription>
                            </div>
                        </div>

                        {/* Navigation Tabs */}
                        <div className="flex items-center gap-1 bg-muted p-1 rounded-xl w-full sm:w-auto shrink-0">
                            <button
                                type="button"
                                onClick={() => setActiveTab("details")}
                                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all text-center ${
                                    activeTab === "details"
                                        ? "bg-background text-foreground shadow-xs"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                Profile Details
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab("documents")}
                                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                    activeTab === "documents"
                                        ? "bg-background text-foreground shadow-xs"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                <FileText className="size-3.5" />
                                <span>Documents</span>
                                {documents.length > 0 && (
                                    <span className="px-1.5 py-0.2 rounded-full bg-primary/20 text-primary text-[10px] font-extrabold">
                                        {documents.length}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </DialogHeader>

                {/* Body Content */}
                <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-6 space-y-4 sm:space-y-6">
                    {activeTab === "details" && (
                        <div className="space-y-6">
                            {/* Non-Login Record Notice */}
                            <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-3 text-xs text-blue-700 dark:text-blue-300">
                                <ShieldCheck className="size-4 shrink-0 text-blue-600 dark:text-blue-400" />
                                <span>
                                    <strong>Business Contact Profile Only:</strong> This profile is used for business records, challans, and tracking. It does not create application user logins or store passwords.
                                </span>
                            </div>

                            {/* Section 1: Standard Company Details */}
                            <div className="bg-card border border-border/60 rounded-2xl p-3.5 sm:p-5 shadow-xs space-y-3 sm:space-y-4">
                                <h3 className="text-sm font-bold text-foreground flex items-center gap-2 pb-2 border-b border-border/40">
                                    <Building2 className="size-4 text-primary" />
                                    Business Identity & Code
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Name */}
                                    <div className="md:col-span-2">
                                        <label className="text-xs font-bold text-foreground block mb-1.5">
                                            {profileType === "Subcontractor" ? "Subcontractor / Vendor Name" : profileType === "ScrapDealer" ? "Scrap Dealer / Firm Name" : "Supplier / Purchaser Name"} <span className="text-rose-500">*</span>
                                        </label>
                                        <Input
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="e.g. RADHE SWAMI CONSTRUCTION"
                                            className="h-10 rounded-xl bg-background border-border/70 text-sm font-semibold"
                                            required
                                        />
                                    </div>

                                    {/* Code */}
                                    <div className="md:col-span-2">
                                        <label className="text-xs font-bold text-foreground block mb-1.5">
                                            Profile Code <span className="text-muted-foreground font-normal">(Auto-generated if left blank)</span>
                                        </label>
                                        <Input
                                            value={code}
                                            onChange={(e) => setCode(e.target.value)}
                                            placeholder={profileType === "Subcontractor" ? "e.g. SUB-0001" : profileType === "ScrapDealer" ? "e.g. SCR-0001" : "e.g. SUP-0001"}
                                            className="h-10 rounded-xl bg-background border-border/70 text-sm font-mono uppercase font-medium"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Contact Person & Details */}
                            <div className="bg-card border border-border/60 rounded-2xl p-3.5 sm:p-5 shadow-xs space-y-3 sm:space-y-4">
                                <div className="flex items-center justify-between pb-2 border-b border-border/40">
                                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                        <UserCheck className="size-4 text-primary" />
                                        <span>Key Personnel & Contact Details</span>
                                        {keyPersonnel.length > 1 && (
                                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                                                {keyPersonnel.length}
                                            </span>
                                        )}
                                    </h3>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleAddPersonnel}
                                        className="h-8 px-2.5 text-xs font-semibold gap-1.5 rounded-xl border-primary/30 text-primary hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all shadow-xs"
                                        title="Add one more Key Personnel & Contact Details"
                                    >
                                        <Plus className="size-3.5" />
                                        <span>Add Personnel</span>
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    {keyPersonnel.map((contact, idx) => (
                                        <div
                                            key={idx}
                                            className={
                                                keyPersonnel.length > 1
                                                    ? "p-3.5 sm:p-4 rounded-xl bg-muted/20 border border-border/60 space-y-3 transition-all"
                                                    : "space-y-3"
                                            }
                                        >
                                            {keyPersonnel.length > 1 && (
                                                <div className="flex items-center justify-between pb-2 border-b border-border/40">
                                                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                                        <span className="w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[10px] font-bold">
                                                            {idx + 1}
                                                        </span>
                                                        {idx === 0 ? "Primary Contact Person" : `Key Personnel #${idx + 1}`}
                                                    </span>
                                                    {idx > 0 && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleRemovePersonnel(idx)}
                                                            className="h-7 px-2 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition-colors gap-1"
                                                            title="Remove Personnel"
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                            <span>Remove</span>
                                                        </Button>
                                                    )}
                                                </div>
                                            )}

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs font-bold text-foreground block mb-1.5">
                                                        Contact Person Name
                                                    </label>
                                                    <Input
                                                        value={contact.name}
                                                        onChange={(e) => handlePersonnelChange(idx, "name", e.target.value)}
                                                        placeholder="e.g. Dinesh G"
                                                        className="h-10 rounded-xl bg-background border-border/70 text-sm font-medium"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-xs font-bold text-foreground block mb-1.5">
                                                        Designation
                                                    </label>
                                                    <Input
                                                        value={contact.designation}
                                                        onChange={(e) => handlePersonnelChange(idx, "designation", e.target.value)}
                                                        placeholder="e.g. Site Manager / Proprietor"
                                                        className="h-10 rounded-xl bg-background border-border/70 text-sm font-medium"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-xs font-bold text-foreground block mb-1.5 flex items-center gap-1.5">
                                                        <PhoneCall className="size-3.5 text-primary" />
                                                        Primary Phone Number {idx === 0 && <span className="text-rose-500">*</span>}
                                                    </label>
                                                    <Input
                                                        value={contact.phone}
                                                        onChange={(e) => handlePersonnelChange(idx, "phone", e.target.value)}
                                                        placeholder="e.g. 9934110587"
                                                        className="h-10 rounded-xl bg-background border-border/70 text-sm font-medium"
                                                        required={idx === 0}
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-xs font-bold text-foreground block mb-1.5 flex items-center gap-1.5">
                                                        <PhoneCall className="size-3.5 text-muted-foreground" />
                                                        Alternate Phone Number
                                                    </label>
                                                    <Input
                                                        value={contact.alternatePhone}
                                                        onChange={(e) => handlePersonnelChange(idx, "alternatePhone", e.target.value)}
                                                        placeholder="e.g. 9876543210"
                                                        className="h-10 rounded-xl bg-background border-border/70 text-sm font-medium"
                                                    />
                                                </div>

                                                <div className="md:col-span-2">
                                                    <label className="text-xs font-bold text-foreground block mb-1.5 flex items-center gap-1.5">
                                                        <Mail className="size-3.5 text-primary" />
                                                        Email Address
                                                    </label>
                                                    <Input
                                                        type="email"
                                                        value={contact.email}
                                                        onChange={(e) => handlePersonnelChange(idx, "email", e.target.value)}
                                                        placeholder="e.g. contact@company.com"
                                                        className="h-10 rounded-xl bg-background border-border/70 text-sm font-medium"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {keyPersonnel.length > 1 && (
                                    <div className="pt-2 flex justify-end">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleAddPersonnel}
                                            className="h-8 px-3 text-xs font-semibold gap-1.5 text-primary hover:bg-primary/10 rounded-xl transition-colors"
                                        >
                                            <Plus className="size-3.5" />
                                            <span>Add Another Key Personnel</span>
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Section 3: Identifiers, PAN, GST, Licenses */}
                            <div className="bg-card border border-border/60 rounded-2xl p-3.5 sm:p-5 shadow-xs space-y-3 sm:space-y-4">
                                <h3 className="text-sm font-bold text-foreground flex items-center gap-2 pb-2 border-b border-border/40">
                                    <Hash className="size-4 text-primary" />
                                    Tax Identification & Licenses
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-foreground block mb-1.5">
                                            GST Number
                                        </label>
                                        <Input
                                            value={gstNumber}
                                            onChange={(e) => setGstNumber(e.target.value)}
                                            placeholder="e.g. 27AAACL0140P1Z0"
                                            className="h-10 rounded-xl bg-background border-border/70 text-sm font-mono uppercase font-medium"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-foreground block mb-1.5">
                                            PAN Number
                                        </label>
                                        <Input
                                            value={panNumber}
                                            onChange={(e) => setPanNumber(e.target.value)}
                                            placeholder="e.g. AAACL0140P"
                                            className="h-10 rounded-xl bg-background border-border/70 text-sm font-mono uppercase font-medium"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-foreground block mb-1.5">
                                            Aadhaar Number <span className="text-muted-foreground font-normal">(Proprietor/Contact)</span>
                                        </label>
                                        <Input
                                            value={aadhaarNumber}
                                            onChange={(e) => setAadhaarNumber(formatAadhaarNumber(e.target.value, aadhaarNumber))}
                                            placeholder="e.g. 1234-5678-9012"
                                            maxLength={14}
                                            className="h-10 rounded-xl bg-background border-border/70 text-sm font-mono font-medium"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-foreground block mb-1.5">
                                            {profileType === "ScrapDealer" ? "Scrap Trade License No." : "Trade / Operating License No."}
                                        </label>
                                        <Input
                                            value={licenseNumber}
                                            onChange={(e) => setLicenseNumber(e.target.value)}
                                            placeholder={profileType === "ScrapDealer" ? "e.g. PCB/SCRAP/2026/0892" : "e.g. LIC-2026-9812"}
                                            className="h-10 rounded-xl bg-background border-border/70 text-sm font-mono font-medium"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="text-xs font-bold text-foreground block mb-1.5 flex items-center gap-1.5">
                                            <MapPin className="size-3.5 text-primary" />
                                            Office / Site / Yard Address
                                        </label>
                                        <Textarea
                                            value={address}
                                            onChange={(e) => setAddress(e.target.value)}
                                            placeholder="Enter registered business or site address"
                                            className="min-h-[70px] rounded-xl bg-background border-border/70 text-sm font-medium"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 4: Dynamic Custom Fields configured in Forms Management */}
                            {loadingForm && (
                                <div className="flex items-center gap-2 p-3 text-xs text-muted-foreground">
                                    <Loader2 className="size-4 animate-spin text-primary" />
                                    <span>Loading custom fields...</span>
                                </div>
                            )}
                            {formDefinition && formDefinition.fields && formDefinition.fields.length > 0 && (
                                <div className="bg-card border border-border/60 rounded-2xl p-3.5 sm:p-5 shadow-xs space-y-3 sm:space-y-4">
                                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2 pb-2 border-b border-border/40">
                                        <FileCheck className="size-4 text-primary" />
                                        Custom Fields (Configured in Forms Management)
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {formDefinition.fields
                                            .filter((f: any) => !['name', 'code', 'contactPerson', 'contactDesignation', 'contactEmail', 'contactPhone', 'alternatePhone', 'keyPersonnel', 'address', 'gstNumber', 'panNumber', 'aadhaarNumber', 'licenseNumber', 'status'].includes(f.name))
                                            .map((field: any) => (
                                                <div key={field.id} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                                                    <label className="text-xs font-bold text-foreground block mb-1.5">
                                                        {field.label}
                                                    </label>
                                                    {field.type === 'select' ? (
                                                        <Select
                                                            value={customFields[field.name] || ''}
                                                            onValueChange={(val) => handleCustomFieldChange(field.name, val)}
                                                        >
                                                            <SelectTrigger className="h-10 w-full rounded-xl bg-background border-border/70 text-sm font-medium">
                                                                <SelectValue placeholder={`Select ${field.label}`} />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {(field.options || []).map((opt: any) => (
                                                                    <SelectItem key={opt.value} value={opt.value}>
                                                                        {opt.label}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    ) : field.type === 'textarea' ? (
                                                        <Textarea
                                                            value={customFields[field.name] || ''}
                                                            onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
                                                            placeholder={field.placeholder || ''}
                                                            className="min-h-[60px] rounded-xl bg-background border-border/70 text-sm font-medium"
                                                        />
                                                    ) : (
                                                        <Input
                                                            type={field.type === 'number' ? 'number' : 'text'}
                                                            value={customFields[field.name] || ''}
                                                            onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
                                                            placeholder={field.placeholder || ''}
                                                            className="h-10 rounded-xl bg-background border-border/70 text-sm font-medium"
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 2: DOCUMENT UPLOADS & MANAGEMENT */}
                    {activeTab === "documents" && (
                        <div className="space-y-6">
                            {/* Upload Box */}
                            <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-xs space-y-4">
                                <h3 className="text-sm font-bold text-foreground flex items-center gap-2 pb-2 border-b border-border/40">
                                    <UploadCloud className="size-4 text-primary" />
                                    Upload New Document (Aadhaar, PAN, GST, Agreement, License)
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-foreground block mb-1.5">
                                            Document Category <span className="text-rose-500">*</span>
                                        </label>
                                        <Select value={docCategory} onValueChange={(val) => val && setDocCategory(val)}>
                                            <SelectTrigger className="h-10 w-full rounded-xl bg-background border-border/70 text-sm font-medium">
                                                <SelectValue placeholder="Select Category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {DOCUMENT_CATEGORIES.map(cat => (
                                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="text-xs font-bold text-foreground block mb-1.5">
                                            Document Title / Reference Name
                                        </label>
                                        <Input
                                            value={docTitle}
                                            onChange={(e) => setDocTitle(e.target.value)}
                                            placeholder="e.g. GST Certificate 2026-27 or GSTIN Verification Copy"
                                            className="h-10 rounded-xl bg-background border-border/70 text-sm font-medium"
                                        />
                                    </div>

                                    <div className="md:col-span-3">
                                        <label className="text-xs font-bold text-foreground block mb-1.5">
                                            Select Document File <span className="text-rose-500">*</span>
                                        </label>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                            <Input
                                                type="file"
                                                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
                                                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                                className="h-10 rounded-xl bg-background border-border/70 text-sm font-medium flex-1 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                                            />
                                            {isEdit && (
                                                <Button
                                                    type="button"
                                                    onClick={handleUploadDocumentNow}
                                                    disabled={uploadingDoc || !selectedFile}
                                                    className="w-full sm:w-auto h-10 rounded-xl px-4 font-semibold text-xs bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 shadow-xs cursor-pointer flex items-center justify-center"
                                                >
                                                    {uploadingDoc ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
                                                    Upload Document
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Documents List */}
                            <div className="bg-card border border-border/60 rounded-2xl p-3.5 sm:p-5 shadow-xs space-y-3 sm:space-y-4">
                                <h3 className="text-sm font-bold text-foreground flex items-center gap-2 pb-2 border-b border-border/40 justify-between">
                                    <span className="flex items-center gap-2">
                                        <FileText className="size-4 text-primary" />
                                        Associated Documents ({documents.length})
                                    </span>
                                </h3>

                                {documents.length === 0 ? (
                                    <div className="py-12 text-center text-muted-foreground border-2 border-dashed border-border/50 rounded-xl">
                                        <UploadCloud className="size-10 mx-auto mb-2 opacity-30 text-primary" />
                                        <p className="font-semibold text-sm">No documents attached yet.</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Upload Aadhaar, PAN, GST certificate, agreements, or trade licenses above.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-border/40">
                                        {documents.map((doc: any, i: number) => {
                                            const fileUrl = doc.fileName ? profileService.getDocumentDownloadUrl(doc.fileName) : doc.fileUrl;

                                            return (
                                                <div key={doc._id || i} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 first:pt-0 last:pb-0">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                                                            <FileText className="size-5" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-bold text-sm text-foreground truncate">{doc.title || doc.originalName}</p>
                                                                <span className="px-2 py-0.5 rounded-md bg-muted font-bold text-[10px] text-muted-foreground shrink-0 border border-border/50">
                                                                    {doc.documentType || "Document"}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                                                {doc.originalName} • {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : "File"} • Uploaded {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : "recently"}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                                                        {fileUrl && (
                                                            <>
                                                                <a
                                                                    href={fileUrl}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="h-8 px-2.5 rounded-lg border border-border/60 hover:bg-muted text-xs font-semibold flex items-center gap-1 transition-colors"
                                                                    title="View Document"
                                                                >
                                                                    <Eye className="size-3.5 text-primary" />
                                                                    View
                                                                </a>
                                                                <a
                                                                    href={fileUrl}
                                                                    download={doc.originalName || doc.title}
                                                                    className="h-8 px-2.5 rounded-lg border border-border/60 hover:bg-muted text-xs font-semibold flex items-center gap-1 transition-colors"
                                                                    title="Download Document"
                                                                >
                                                                    <Download className="size-3.5 text-primary" />
                                                                    Download
                                                                </a>
                                                            </>
                                                        )}
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDeleteDocNow(doc._id)}
                                                            className="h-8 w-8 p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                                                            title="Delete Document"
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </form>

                {/* Footer Action Bar */}
                <div className="p-3.5 sm:p-4 border-t border-border/60 bg-muted/30 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3 shrink-0">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        className="w-full sm:w-auto h-10 rounded-xl px-5 font-semibold cursor-pointer"
                        disabled={saving}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSubmit}
                        className="w-full sm:w-auto h-10 rounded-xl px-6 font-semibold bg-primary text-primary-foreground hover:bg-primary/90 gap-2 cursor-pointer shadow-sm flex items-center justify-center"
                        disabled={saving}
                    >
                        {saving && <Loader2 className="size-4 animate-spin" />}
                        <span>{isEdit ? `Update ${meta.title}` : `Create ${meta.title}`}</span>
                        <ArrowRightIcon className="size-4" />
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default ProfileFormModal;
