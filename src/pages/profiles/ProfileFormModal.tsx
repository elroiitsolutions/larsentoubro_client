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
    Plus,
    X
} from "lucide-react"
import profileService, { type ProfileRecord, type ProfileType, type KeyPersonnelContact } from "@/services/profile.service"
import formService from "@/services/form.service"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import { validateEmail, validateIndianMobile } from "@/utils/validation"
import { DatePickerField } from "@/components/DynamicForm/DynamicField"

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

const DEFAULT_PROFILE_PLACEHOLDERS: Record<string, Record<string, string>> = {
    Subcontractor: {
        name: "e.g. RADHE SWAMI CONSTRUCTION",
        code: "e.g. SUB-0001",
        contactPerson: "e.g. Dinesh G",
        contactDesignation: "e.g. Site Manager / Proprietor",
        designation: "e.g. Site Manager / Proprietor",
        contactPhone: "e.g. 9934110587",
        phone: "e.g. 9934110587",
        alternatePhone: "e.g. 9876543210",
        contactEmail: "e.g. contact@company.com",
        email: "e.g. contact@company.com",
        gstNumber: "e.g. 27AAACL0140P1Z0",
        gst: "e.g. 27AAACL0140P1Z0",
        panNumber: "e.g. AAACL0140P",
        pan: "e.g. AAACL0140P",
        aadhaarNumber: "e.g. 1234-5678-9012",
        aadhaar: "e.g. 1234-5678-9012",
        licenseNumber: "e.g. LIC-2026-9812",
        license: "e.g. LIC-2026-9812",
        address: "Enter registered business or site address"
    },
    ScrapDealer: {
        name: "e.g. SHREE METALS SCRAP DEALERS",
        code: "e.g. SCR-0001",
        contactPerson: "e.g. Ramesh Patel",
        contactDesignation: "e.g. Proprietor / Manager",
        designation: "e.g. Proprietor / Manager",
        contactPhone: "e.g. 9820012345",
        phone: "e.g. 9820012345",
        alternatePhone: "e.g. 9876543210",
        contactEmail: "e.g. ramesh@shreemetals.com",
        email: "e.g. ramesh@shreemetals.com",
        gstNumber: "e.g. 27AAACS1234P1Z5",
        gst: "e.g. 27AAACS1234P1Z5",
        panNumber: "e.g. AAACS1234P",
        pan: "e.g. AAACS1234P",
        aadhaarNumber: "e.g. 1234-5678-9012",
        aadhaar: "e.g. 1234-5678-9012",
        licenseNumber: "e.g. PCB/SCRAP/2026/0892",
        license: "e.g. PCB/SCRAP/2026/0892",
        address: "Enter scrap yard address"
    },
    Supplier: {
        name: "e.g. HILTI INDIA PRIVATE LIMITED",
        code: "e.g. SUP-0001",
        contactPerson: "e.g. Amit Sharma",
        contactDesignation: "e.g. Sales / Account Manager",
        designation: "e.g. Sales / Account Manager",
        contactPhone: "e.g. 9812345678",
        phone: "e.g. 9812345678",
        alternatePhone: "e.g. 9876543210",
        contactEmail: "e.g. sales@hilti.com",
        email: "e.g. sales@hilti.com",
        gstNumber: "e.g. 07AAACH0042P1Z3",
        gst: "e.g. 07AAACH0042P1Z3",
        panNumber: "e.g. AAACH0042P",
        pan: "e.g. AAACH0042P",
        aadhaarNumber: "e.g. 1234-5678-9012",
        aadhaar: "e.g. 1234-5678-9012",
        licenseNumber: "e.g. IND-MFG-9842",
        license: "e.g. IND-MFG-9842",
        address: "Enter corporate address"
    }
};

export function ProfileFormModal({
    isOpen,
    onClose,
    profileType,
    editingProfile,
    onSuccess,
}: ProfileFormModalProps) {
    const { user: currentUser } = useAuth()
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
            let val = value
            if (field === 'phone' || field === 'alternatePhone') {
                // Enforce only digits and maximum 10 digits without country code
                val = val.replace(/\D/g, '').slice(0, 10)
            }
            updated[index] = { ...updated[index], [field]: val }
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

    // Helper to verify if a field is configured as required in Forms Management
    const isFieldRequired = (fieldName: string, altNames: string[] = []): boolean => {
        if (!formDefinition?.fields || !Array.isArray(formDefinition.fields)) return false
        const candidates = [fieldName, ...altNames]
        const field = formDefinition.fields.find(
            (f: any) => candidates.includes(f.name) || candidates.includes(f.id)
        )
        if (!field) return false
        return Boolean(
            field.required ||
            (Array.isArray(field.validations) && field.validations.some((v: any) => v.type === 'required'))
        )
    }

    // Helper to get field definition from dynamic form schema
    const getFieldDef = (fieldName: string, altNames: string[] = []): any => {
        if (!formDefinition?.fields || !Array.isArray(formDefinition.fields)) return null
        const candidates = [fieldName, ...altNames]
        return formDefinition.fields.find(
            (f: any) => candidates.includes(f.name) || candidates.includes(f.id)
        ) || null
    }

    // Helper to dynamically read placeholder configured in Forms Management with proper defaults
    const getFieldPlaceholder = (fieldName: string, altNames: string[] = []): string | undefined => {
        const def = getFieldDef(fieldName, altNames)
        if (def && typeof def.placeholder === 'string' && def.placeholder.trim()) {
            return def.placeholder.trim()
        }
        const typeDefaults = DEFAULT_PROFILE_PLACEHOLDERS[profileType] || {}
        return typeDefaults[fieldName] || altNames.map(a => typeDefaults[a]).find(Boolean) || undefined
    }

    // Helper to dynamically read field label configured in Forms Management
    const getFieldLabel = (fieldName: string, fallback: string, altNames: string[] = []): string => {
        const def = getFieldDef(fieldName, altNames)
        if (def && typeof def.label === 'string' && def.label.trim()) {
            return def.label.trim()
        }
        return fallback
    }

    // Helper to dynamically read helper description text configured in Forms Management
    const getFieldHelperText = (fieldName: string, altNames: string[] = []): string | null => {
        const def = getFieldDef(fieldName, altNames)
        if (def && typeof def.helperText === 'string' && def.helperText.trim()) {
            return def.helperText.trim()
        }
        return null
    }

    // Filter dynamic custom fields (fields not part of standard profile model)
    const customFieldDefs = React.useMemo(() => {
        if (!formDefinition?.fields || !Array.isArray(formDefinition.fields)) return []
        const standardKeys = [
            'name', 'code', 'contactPerson', 'contactDesignation',
            'contactEmail', 'email', 'contactPhone', 'alternatePhone',
            'keyPersonnel', 'address', 'gstNumber', 'panNumber',
            'aadhaarNumber', 'licenseNumber', 'status'
        ]
        return formDefinition.fields.filter(
            (f: any) => !standardKeys.includes(f.name) && !standardKeys.includes(f.id)
        )
    }, [formDefinition])

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

        // 1. Business / Vendor Name
        if (!name.trim()) {
            toast.error(`${meta.title} Name is required.`)
            return
        }

        // 2. Profile Code (if required by form settings)
        if (isFieldRequired('code') && !code.trim()) {
            toast.error("Profile Code is required.")
            return
        }

        const primaryPerson = (keyPersonnel[0]?.name || "").trim()
        const primaryDesignation = (keyPersonnel[0]?.designation || "").trim()
        const primaryPhone = (keyPersonnel[0]?.phone || "").trim()
        const primaryEmail = (keyPersonnel[0]?.email || "").trim()

        // 3. Contact Person Name (if required)
        if (isFieldRequired('contactPerson') && !primaryPerson) {
            toast.error("Contact Person Name is required.")
            return
        }

        // 4. Contact Designation (if required)
        if (isFieldRequired('contactDesignation', ['designation']) && !primaryDesignation) {
            toast.error("Designation is required.")
            return
        }

        // 5. Contact Phone (Only 10 numbers, Indian starting with 6-9, no country code)
        const primaryAltPhone = (keyPersonnel[0]?.alternatePhone || "").trim()
        const phoneRequired = isFieldRequired('contactPhone', ['phone'])

        if (phoneRequired && !primaryPhone) {
            toast.error("Primary Phone Number is required.")
            return
        }

        if (primaryPhone) {
            const phoneCheck = validateIndianMobile(primaryPhone, "Primary Phone Number")
            if (!phoneCheck.isValid) {
                toast.error(phoneCheck.error || "Primary Phone Number must be a valid 10-digit Indian number starting with 6, 7, 8, or 9.")
                return
            }
        }

        if (primaryAltPhone) {
            const altPhoneCheck = validateIndianMobile(primaryAltPhone, "Alternate Phone Number")
            if (!altPhoneCheck.isValid) {
                toast.error(altPhoneCheck.error || "Alternate Phone Number must be a valid 10-digit Indian number starting with 6, 7, 8, or 9.")
                return
            }
        }

        // 6. Contact Email (Strictly enforce when marked required in Forms Management)
        const emailRequired = isFieldRequired('contactEmail', ['email'])
        if (emailRequired && !primaryEmail) {
            toast.error("Email Address is required.")
            return
        }

        // Baseline contact rule: at least phone or email must be present
        if (!primaryPhone && !primaryEmail) {
            toast.error("Please provide at least a phone number or email address.")
            return
        }

        // 7. Validate Email Address format when provided (must contain '@' and '.')
        if (primaryEmail) {
            const emailCheck = validateEmail(primaryEmail)
            if (!emailCheck.isValid) {
                toast.error(emailCheck.error || "Email address must contain '@' and '.'.")
                return
            }
        }

        // Validate all key personnel phone numbers and email addresses
        for (let i = 0; i < keyPersonnel.length; i++) {
            const kp = keyPersonnel[i]
            const prefix = keyPersonnel.length > 1 ? `Key Personnel #${i + 1}: ` : ""

            if (i > 0 && kp.phone && kp.phone.trim()) {
                const kpPhoneCheck = validateIndianMobile(kp.phone.trim(), `${prefix}Phone Number`)
                if (!kpPhoneCheck.isValid) {
                    toast.error(kpPhoneCheck.error)
                    return
                }
            }

            if (i > 0 && kp.alternatePhone && kp.alternatePhone.trim()) {
                const kpAltCheck = validateIndianMobile(kp.alternatePhone.trim(), `${prefix}Alternate Phone Number`)
                if (!kpAltCheck.isValid) {
                    toast.error(kpAltCheck.error)
                    return
                }
            }

            if (kp.email && kp.email.trim()) {
                const kpCheck = validateEmail(kp.email.trim())
                if (!kpCheck.isValid) {
                    toast.error(`${prefix}${kpCheck.error || "Email address must contain '@' and '.'."}`)
                    return
                }
            }
        }

        // 8. Other standard profile fields if configured as required
        if (isFieldRequired('gstNumber', ['gst']) && !gstNumber.trim()) {
            toast.error("GST Number is required.")
            return
        }
        if (isFieldRequired('panNumber', ['pan']) && !panNumber.trim()) {
            toast.error("PAN Number is required.")
            return
        }
        if (isFieldRequired('aadhaarNumber', ['aadhaar']) && !aadhaarNumber.trim()) {
            toast.error("Aadhaar Number is required.")
            return
        }
        if (isFieldRequired('licenseNumber', ['license']) && !licenseNumber.trim()) {
            toast.error("License Number is required.")
            return
        }
        if (isFieldRequired('address') && !address.trim()) {
            toast.error("Office / Site / Yard Address is required.")
            return
        }

        // 9. Dynamic Custom Fields validation
        for (const field of customFieldDefs) {
            const isReq = Boolean(
                field.required ||
                (Array.isArray(field.validations) && field.validations.some((v: any) => v.type === 'required'))
            )
            const fieldKey = field.name || field.id
            const val = customFields[fieldKey] ?? customFields[field.name] ?? customFields[field.id]

            if (isReq && (val === undefined || val === null || String(val).trim() === '')) {
                const reqMsg = (field.validations && field.validations.find((v: any) => v.type === 'required')?.message)
                    || `${field.label || field.name} is required.`
                toast.error(reqMsg)
                return
            }

            if ((field.type === 'email' || field.name?.toLowerCase().includes('email')) && val) {
                const emailCheck = validateEmail(String(val).trim())
                if (!emailCheck.isValid) {
                    toast.error(`${field.label}: ${emailCheck.error || "Must contain '@' and '.'."}`)
                    return
                }
            }
        }

        setSaving(true)
        try {
            const primaryContact = keyPersonnel[0] || emptyContact

            const normalizedCustomFields: Record<string, any> = { ...customFields }
            customFieldDefs.forEach((field: any) => {
                const key = field.name || field.id
                if (customFields[key] !== undefined) {
                    normalizedCustomFields[key] = customFields[key]
                    if (field.name) normalizedCustomFields[field.name] = customFields[key]
                    if (field.id) normalizedCustomFields[field.id] = customFields[key]
                }
            })

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
                customFields: normalizedCustomFields,
                ...(!isEdit && {
                    createdBy: {
                        _id: currentUser?.id || (currentUser as any)?._id,
                        name: currentUser?.name || currentUser?.username || 'Admin',
                        email: currentUser?.email || '',
                        role: currentUser?.role || 'Admin'
                    }
                })
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
                    await profileService.uploadDocument(res.data._id, formData, profileType).catch(() => {})
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

            const res = await profileService.uploadDocument(editingProfile._id, formData, profileType)
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
            <DialogContent hideClose={true} className="w-[calc(100%-1rem)] sm:w-full max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-xl">
                {/* Header */}
                <DialogHeader className="p-3 sm:px-5 sm:py-3 border-b border-border/60 bg-muted/20 shrink-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
                        {/* Title & Icon (with mobile-only close button) */}
                        <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-2.5 min-w-0">
                            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                                <div className={`p-1.5 sm:p-2 rounded-lg ${meta.bgColor} ${meta.color} shrink-0`}>
                                    <Building2 className="size-4 sm:size-4.5" />
                                </div>
                                <div className="min-w-0">
                                    <DialogTitle className="text-sm sm:text-base font-bold text-foreground leading-snug">
                                        {isEdit ? `Edit ${meta.title} Record` : `Create ${meta.title} Profile`}
                                    </DialogTitle>
                                    <DialogDescription className="text-[11px] text-muted-foreground mt-0.5 leading-normal truncate sm:whitespace-normal">
                                        Manage contact profile, tax identifiers, and legal document uploads.
                                    </DialogDescription>
                                </div>
                            </div>

                            {/* Mobile-only Close / Cancel (✕) button */}
                            <button
                                type="button"
                                onClick={onClose}
                                className="sm:hidden rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors shrink-0 cursor-pointer"
                                aria-label="Close modal"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        {/* Navigation Tabs & Desktop Close / Cancel (✕) button */}
                        <div className="flex items-center gap-2 sm:gap-2.5 w-full sm:w-auto shrink-0 justify-between sm:justify-end">
                            {/* Navigation Tabs */}
                            <div className="flex items-center gap-1 bg-muted/80 p-0.5 rounded-lg w-full sm:w-auto shrink-0 border border-border/50">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("details")}
                                    className={`flex-1 sm:flex-initial px-2.5 py-1 rounded-md text-[11px] font-bold transition-all text-center cursor-pointer ${
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
                                    className={`flex-1 sm:flex-initial px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                        activeTab === "documents"
                                            ? "bg-background text-foreground shadow-xs"
                                            : "text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    <FileText className="size-3" />
                                    <span>Documents</span>
                                    {documents.length > 0 && (
                                        <span className="px-1.5 py-0.2 rounded-full bg-primary/20 text-primary text-[10px] font-extrabold">
                                            {documents.length}
                                        </span>
                                    )}
                                </button>
                            </div>

                            {/* Desktop Close / Cancel (✕) button: Vertically centered with tabs */}
                            <div className="hidden sm:flex items-center pl-1 border-l border-border/60">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                                    aria-label="Close modal"
                                    title="Close"
                                >
                                    <X className="size-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                {/* Body Content */}
                <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-5 space-y-3.5 sm:space-y-4">
                    {activeTab === "details" && (
                        <div className="space-y-3.5 sm:space-y-4">
                            {/* Non-Login Record Notice */}
                            <div className="p-2.5 sm:p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center gap-2.5 text-[11px] leading-relaxed text-blue-700 dark:text-blue-300">
                                <ShieldCheck className="size-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
                                <span>
                                    <strong>Business Contact Profile Only:</strong> This profile is used for business records, challans, and tracking. It does not create application user logins or store passwords.
                                </span>
                            </div>

                            {/* Section 1: Standard Company Details */}
                            <div className="bg-card border border-border/60 rounded-xl p-3 sm:p-4 shadow-2xs space-y-2.5 sm:space-y-3">
                                <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5 pb-1.5 border-b border-border/40">
                                    <Building2 className="size-3.5 text-primary" />
                                    <span>Business Identity & Code</span>
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3.5">
                                    {/* Name */}
                                    <div className="md:col-span-2">
                                        <label className="text-[11px] font-semibold text-foreground/90 block mb-1">
                                            {getFieldLabel('name', profileType === "Subcontractor" ? "Subcontractor / Vendor Name" : profileType === "ScrapDealer" ? "Scrap Dealer / Firm Name" : "Supplier / Purchaser Name")} <span className="text-rose-500">*</span>
                                        </label>
                                        <Input
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder={getFieldPlaceholder('name')}
                                            className="h-7.5 sm:h-8 rounded-lg bg-background border-border/70 text-xs font-semibold px-2.5"
                                            required
                                        />
                                        {getFieldHelperText('name') && (
                                            <p className="text-[10px] text-muted-foreground mt-0.5">{getFieldHelperText('name')}</p>
                                        )}
                                    </div>

                                    {/* Code */}
                                    <div className="md:col-span-2">
                                        <label className="text-[11px] font-semibold text-foreground/90 block mb-1">
                                            {getFieldLabel('code', 'Profile Code')} {isFieldRequired('code') && <span className="text-rose-500">*</span>} <span className="text-muted-foreground font-normal">(Auto-generated if left blank)</span>
                                        </label>
                                        <Input
                                            value={code}
                                            onChange={(e) => setCode(e.target.value)}
                                            placeholder={getFieldPlaceholder('code')}
                                            className="h-7.5 sm:h-8 rounded-lg bg-background border-border/70 text-xs font-mono uppercase font-medium px-2.5"
                                        />
                                        {getFieldHelperText('code') && (
                                            <p className="text-[10px] text-muted-foreground mt-0.5">{getFieldHelperText('code')}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Contact Person & Details */}
                            <div className="bg-card border border-border/60 rounded-xl p-3 sm:p-4 shadow-2xs space-y-2.5 sm:space-y-3">
                                <div className="flex items-center justify-between pb-1.5 border-b border-border/40">
                                    <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                        <UserCheck className="size-3.5 text-primary" />
                                        <span>Key Personnel & Contact Details</span>
                                        {keyPersonnel.length > 1 && (
                                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-primary/10 text-primary font-bold">
                                                {keyPersonnel.length}
                                            </span>
                                        )}
                                    </h3>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleAddPersonnel}
                                        className="h-7 px-2 text-[11px] font-semibold gap-1 rounded-lg border-primary/30 text-primary hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all shadow-2xs"
                                        title="Add one more Key Personnel & Contact Details"
                                    >
                                        <Plus className="size-3" />
                                        <span>Add Personnel</span>
                                    </Button>
                                </div>

                                <div className="space-y-3">
                                    {keyPersonnel.map((contact, idx) => (
                                        <div
                                            key={idx}
                                            className={
                                                keyPersonnel.length > 1
                                                    ? "p-2.5 sm:p-3 rounded-lg bg-muted/20 border border-border/60 space-y-2.5 transition-all"
                                                    : "space-y-2.5"
                                            }
                                        >
                                            {keyPersonnel.length > 1 && (
                                                <div className="flex items-center justify-between pb-1.5 border-b border-border/40">
                                                    <span className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                                                        <span className="w-4 h-4 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[9px] font-bold">
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
                                                            className="h-6 px-1.5 text-[10.5px] text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-md transition-colors gap-1"
                                                            title="Remove Personnel"
                                                        >
                                                            <Trash2 className="size-3" />
                                                            <span>Remove</span>
                                                        </Button>
                                                    )}
                                                </div>
                                            )}

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3.5">
                                                <div>
                                                    <label className="text-[11px] font-semibold text-foreground/90 block mb-1">
                                                        {getFieldLabel('contactPerson', 'Contact Person Name')} {isFieldRequired('contactPerson') && <span className="text-rose-500">*</span>}
                                                    </label>
                                                    <Input
                                                        value={contact.name}
                                                        onChange={(e) => handlePersonnelChange(idx, "name", e.target.value)}
                                                        placeholder={getFieldPlaceholder('contactPerson')}
                                                        className="h-7.5 sm:h-8 rounded-lg bg-background border-border/70 text-xs font-medium px-2.5"
                                                    />
                                                    {getFieldHelperText('contactPerson') && (
                                                        <p className="text-[10px] text-muted-foreground mt-0.5">{getFieldHelperText('contactPerson')}</p>
                                                    )}
                                                </div>

                                                <div>
                                                    <label className="text-[11px] font-semibold text-foreground/90 block mb-1">
                                                        {getFieldLabel('contactDesignation', 'Designation', ['designation'])} {isFieldRequired('contactDesignation', ['designation']) && <span className="text-rose-500">*</span>}
                                                    </label>
                                                    <Input
                                                        value={contact.designation}
                                                        onChange={(e) => handlePersonnelChange(idx, "designation", e.target.value)}
                                                        placeholder={getFieldPlaceholder('contactDesignation', ['designation'])}
                                                        className="h-7.5 sm:h-8 rounded-lg bg-background border-border/70 text-xs font-medium px-2.5"
                                                    />
                                                    {getFieldHelperText('contactDesignation', ['designation']) && (
                                                        <p className="text-[10px] text-muted-foreground mt-0.5">{getFieldHelperText('contactDesignation', ['designation'])}</p>
                                                    )}
                                                </div>

                                                <div>
                                                    <label className="text-[11px] font-semibold text-foreground/90 block mb-1 flex items-center gap-1.5">
                                                        <PhoneCall className="size-3 text-primary" />
                                                        <span>{getFieldLabel('contactPhone', 'Primary Phone Number', ['phone'])}</span>
                                                        {(idx === 0 && (isFieldRequired('contactPhone', ['phone']) || true)) && <span className="text-rose-500">*</span>}
                                                    </label>
                                                    <Input
                                                        value={contact.phone}
                                                        onChange={(e) => handlePersonnelChange(idx, "phone", e.target.value)}
                                                        placeholder={getFieldPlaceholder('contactPhone', ['phone']) || "e.g. 9934110587"}
                                                        maxLength={10}
                                                        inputMode="numeric"
                                                        className="h-7.5 sm:h-8 rounded-lg bg-background border-border/70 text-xs font-medium px-2.5"
                                                        required={idx === 0}
                                                    />
                                                    <p className="text-[9.5px] text-muted-foreground mt-0.5">
                                                        {getFieldHelperText('contactPhone', ['phone']) || "10-digit Indian number starting with 6-9 (no country code)"}
                                                    </p>
                                                </div>

                                                <div>
                                                    <label className="text-[11px] font-semibold text-foreground/90 block mb-1 flex items-center gap-1.5">
                                                        <PhoneCall className="size-3 text-muted-foreground" />
                                                        <span>{getFieldLabel('alternatePhone', 'Alternate Phone Number')}</span>
                                                        {isFieldRequired('alternatePhone') && <span className="text-rose-500">*</span>}
                                                    </label>
                                                    <Input
                                                        value={contact.alternatePhone}
                                                        onChange={(e) => handlePersonnelChange(idx, "alternatePhone", e.target.value)}
                                                        placeholder={getFieldPlaceholder('alternatePhone') || "e.g. 9876543210"}
                                                        maxLength={10}
                                                        inputMode="numeric"
                                                        className="h-7.5 sm:h-8 rounded-lg bg-background border-border/70 text-xs font-medium px-2.5"
                                                    />
                                                    <p className="text-[9.5px] text-muted-foreground mt-0.5">
                                                        {getFieldHelperText('alternatePhone') || "Optional 10-digit Indian number starting with 6-9"}
                                                    </p>
                                                </div>

                                                <div className="md:col-span-2">
                                                    <label className="text-[11px] font-semibold text-foreground/90 block mb-1 flex items-center gap-1.5">
                                                        <Mail className="size-3 text-primary" />
                                                        <span>{getFieldLabel('contactEmail', 'Email Address', ['email'])}</span>
                                                        {(idx === 0 && isFieldRequired('contactEmail', ['email'])) && <span className="text-rose-500">*</span>}
                                                    </label>
                                                    <Input
                                                        type="email"
                                                        value={contact.email}
                                                        onChange={(e) => handlePersonnelChange(idx, "email", e.target.value)}
                                                        placeholder={getFieldPlaceholder('contactEmail', ['email'])}
                                                        className="h-7.5 sm:h-8 rounded-lg bg-background border-border/70 text-xs font-medium px-2.5"
                                                        required={idx === 0 && isFieldRequired('contactEmail', ['email'])}
                                                    />
                                                    {getFieldHelperText('contactEmail', ['email']) && (
                                                        <p className="text-[10px] text-muted-foreground mt-0.5">{getFieldHelperText('contactEmail', ['email'])}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {keyPersonnel.length > 1 && (
                                    <div className="pt-1.5 flex justify-end">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleAddPersonnel}
                                            className="h-7 px-2.5 text-[11px] font-semibold gap-1 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                        >
                                            <Plus className="size-3" />
                                            <span>Add Another Key Personnel</span>
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Section 3: Identifiers, PAN, GST, Licenses */}
                            <div className="bg-card border border-border/60 rounded-xl p-3 sm:p-4 shadow-2xs space-y-2.5 sm:space-y-3">
                                <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5 pb-1.5 border-b border-border/40">
                                    <Hash className="size-3.5 text-primary" />
                                    <span>Tax Identification & Licenses</span>
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3.5">
                                    <div>
                                        <label className="text-[11px] font-semibold text-foreground/90 block mb-1">
                                            {getFieldLabel('gstNumber', 'GST Number', ['gst'])} {isFieldRequired('gstNumber', ['gst']) && <span className="text-rose-500">*</span>}
                                        </label>
                                        <Input
                                            value={gstNumber}
                                            onChange={(e) => setGstNumber(e.target.value)}
                                            placeholder={getFieldPlaceholder('gstNumber', ['gst'])}
                                            className="h-7.5 sm:h-8 rounded-lg bg-background border-border/70 text-xs font-mono uppercase font-medium px-2.5"
                                        />
                                        {getFieldHelperText('gstNumber', ['gst']) && (
                                            <p className="text-[10px] text-muted-foreground mt-0.5">{getFieldHelperText('gstNumber', ['gst'])}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="text-[11px] font-semibold text-foreground/90 block mb-1">
                                            {getFieldLabel('panNumber', 'PAN Number', ['pan'])} {isFieldRequired('panNumber', ['pan']) && <span className="text-rose-500">*</span>}
                                        </label>
                                        <Input
                                            value={panNumber}
                                            onChange={(e) => setPanNumber(e.target.value)}
                                            placeholder={getFieldPlaceholder('panNumber', ['pan'])}
                                            className="h-7.5 sm:h-8 rounded-lg bg-background border-border/70 text-xs font-mono uppercase font-medium px-2.5"
                                        />
                                        {getFieldHelperText('panNumber', ['pan']) && (
                                            <p className="text-[10px] text-muted-foreground mt-0.5">{getFieldHelperText('panNumber', ['pan'])}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="text-[11px] font-semibold text-foreground/90 block mb-1">
                                            {getFieldLabel('aadhaarNumber', 'Aadhaar Number', ['aadhaar'])} {isFieldRequired('aadhaarNumber', ['aadhaar']) && <span className="text-rose-500">*</span>} <span className="text-muted-foreground font-normal">(Proprietor/Contact)</span>
                                        </label>
                                        <Input
                                            value={aadhaarNumber}
                                            onChange={(e) => setAadhaarNumber(formatAadhaarNumber(e.target.value, aadhaarNumber))}
                                            placeholder={getFieldPlaceholder('aadhaarNumber', ['aadhaar'])}
                                            maxLength={14}
                                            className="h-7.5 sm:h-8 rounded-lg bg-background border-border/70 text-xs font-mono font-medium px-2.5"
                                        />
                                        {getFieldHelperText('aadhaarNumber', ['aadhaar']) && (
                                            <p className="text-[10px] text-muted-foreground mt-0.5">{getFieldHelperText('aadhaarNumber', ['aadhaar'])}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="text-[11px] font-semibold text-foreground/90 block mb-1">
                                            {getFieldLabel('licenseNumber', profileType === "ScrapDealer" ? "Scrap Trade License No." : "Trade / Operating License No.", ['license'])} {isFieldRequired('licenseNumber', ['license']) && <span className="text-rose-500">*</span>}
                                        </label>
                                        <Input
                                            value={licenseNumber}
                                            onChange={(e) => setLicenseNumber(e.target.value)}
                                            placeholder={getFieldPlaceholder('licenseNumber', ['license'])}
                                            className="h-7.5 sm:h-8 rounded-lg bg-background border-border/70 text-xs font-mono font-medium px-2.5"
                                        />
                                        {getFieldHelperText('licenseNumber', ['license']) && (
                                            <p className="text-[10px] text-muted-foreground mt-0.5">{getFieldHelperText('licenseNumber', ['license'])}</p>
                                        )}
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="text-[11px] font-semibold text-foreground/90 block mb-1 flex items-center gap-1.5">
                                            <MapPin className="size-3 text-primary" />
                                            <span>{getFieldLabel('address', 'Office / Site / Yard Address')}</span>
                                            {isFieldRequired('address') && <span className="text-rose-500">*</span>}
                                        </label>
                                        <Textarea
                                            value={address}
                                            onChange={(e) => setAddress(e.target.value)}
                                            placeholder={getFieldPlaceholder('address')}
                                            className="min-h-[60px] rounded-lg bg-background border-border/70 text-xs font-medium p-2"
                                        />
                                        {getFieldHelperText('address') && (
                                            <p className="text-[10px] text-muted-foreground mt-0.5">{getFieldHelperText('address')}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Section 4: Dynamic Custom Fields configured in Forms Management */}
                            {loadingForm && (
                                <div className="flex items-center gap-2 p-2.5 text-xs text-muted-foreground">
                                    <Loader2 className="size-3.5 animate-spin text-primary" />
                                    <span>Loading custom fields...</span>
                                </div>
                            )}
                            {customFieldDefs.length > 0 && (
                                <div className="bg-card border border-border/60 rounded-xl p-3 sm:p-4 shadow-2xs space-y-2.5 sm:space-y-3">
                                    <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5 pb-1.5 border-b border-border/40">
                                        <FileCheck className="size-3.5 text-primary" />
                                        <span>Additional Information (Custom Fields)</span>
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3.5">
                                        {customFieldDefs.map((field: any) => {
                                            const isReq = Boolean(
                                                field.required ||
                                                (Array.isArray(field.validations) && field.validations.some((v: any) => v.type === 'required'))
                                            )
                                            const fieldKey = field.name || field.id
                                            const val = customFields[fieldKey] ?? customFields[field.name] ?? customFields[field.id] ?? ''
                                            const fieldTypeLower = String(field.type || '').toLowerCase()
                                            const isDateField = fieldTypeLower === 'date' || fieldTypeLower === 'calendar' || fieldTypeLower === 'calender'

                                            return (
                                                <div key={field.id || field.name} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                                                    <label className="text-[11px] font-semibold text-foreground/90 block mb-1">
                                                        {field.label || field.name} {isReq && <span className="text-rose-500">*</span>}
                                                    </label>
                                                    {field.type === 'select' ? (
                                                        <Select
                                                            value={val}
                                                            onValueChange={(selectedVal) => {
                                                                handleCustomFieldChange(fieldKey, selectedVal)
                                                                if (field.name) handleCustomFieldChange(field.name, selectedVal)
                                                            }}
                                                        >
                                                            <SelectTrigger className="h-7.5 sm:h-8 w-full rounded-lg bg-background border-border/70 text-xs font-medium px-2.5">
                                                                <SelectValue placeholder={field.placeholder?.trim() || undefined} />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {(field.options || []).map((opt: any) => {
                                                                    const optVal = typeof opt === 'string' ? opt : opt.value
                                                                    const optLabel = typeof opt === 'string' ? opt : opt.label
                                                                    return (
                                                                        <SelectItem key={optVal} value={optVal}>
                                                                            {optLabel}
                                                                        </SelectItem>
                                                                    )
                                                                })}
                                                            </SelectContent>
                                                        </Select>
                                                    ) : field.type === 'textarea' ? (
                                                        <Textarea
                                                            value={val}
                                                            onChange={(e) => {
                                                                handleCustomFieldChange(fieldKey, e.target.value)
                                                                if (field.name) handleCustomFieldChange(field.name, e.target.value)
                                                            }}
                                                            placeholder={field.placeholder?.trim() || undefined}
                                                            required={isReq}
                                                            className="min-h-[60px] rounded-lg bg-background border-border/70 text-xs font-medium p-2"
                                                        />
                                                    ) : isDateField ? (
                                                        <DatePickerField
                                                            id={field.id || field.name}
                                                            value={val}
                                                            onChange={(selectedDate) => {
                                                                handleCustomFieldChange(fieldKey, selectedDate)
                                                                if (field.name) handleCustomFieldChange(field.name, selectedDate)
                                                            }}
                                                            placeholder={field.placeholder?.trim() || undefined}
                                                            className="h-7.5 sm:h-8 text-xs font-medium rounded-lg"
                                                        />
                                                    ) : (
                                                        <Input
                                                            type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : 'text'}
                                                            value={val}
                                                            onChange={(e) => {
                                                                handleCustomFieldChange(fieldKey, e.target.value)
                                                                if (field.name) handleCustomFieldChange(field.name, e.target.value)
                                                            }}
                                                            placeholder={field.placeholder?.trim() || undefined}
                                                            required={isReq}
                                                            className="h-7.5 sm:h-8 rounded-lg bg-background border-border/70 text-xs font-medium px-2.5"
                                                        />
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 2: DOCUMENT UPLOADS & MANAGEMENT */}
                    {activeTab === "documents" && (
                        <div className="space-y-3.5 sm:space-y-4">
                            {/* Upload Box */}
                            <div className="bg-card border border-border/60 rounded-xl p-3 sm:p-4 shadow-2xs space-y-2.5 sm:space-y-3">
                                <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5 pb-1.5 border-b border-border/40">
                                    <UploadCloud className="size-3.5 text-primary" />
                                    <span>Upload New Document (Aadhaar, PAN, GST, Agreement, License)</span>
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-3.5">
                                    <div>
                                        <label className="text-[11px] font-semibold text-foreground/90 block mb-1">
                                            Document Category <span className="text-rose-500">*</span>
                                        </label>
                                        <Select value={docCategory} onValueChange={(val) => val && setDocCategory(val)}>
                                            <SelectTrigger className="h-7.5 sm:h-8 w-full rounded-lg bg-background border-border/70 text-xs font-medium px-2.5">
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
                                        <label className="text-[11px] font-semibold text-foreground/90 block mb-1">
                                            Document Title / Reference Name
                                        </label>
                                        <Input
                                            value={docTitle}
                                            onChange={(e) => setDocTitle(e.target.value)}
                                            placeholder="e.g. GST Certificate 2026-27 or GSTIN Verification Copy"
                                            className="h-7.5 sm:h-8 rounded-lg bg-background border-border/70 text-xs font-medium px-2.5"
                                        />
                                    </div>

                                    <div className="md:col-span-3">
                                        <label className="text-[11px] font-semibold text-foreground/90 block mb-1">
                                            Select Document File <span className="text-rose-500">*</span>
                                        </label>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2.5">
                                            <Input
                                                type="file"
                                                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
                                                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                                className="h-7.5 sm:h-8 rounded-lg bg-background border-border/70 text-xs font-medium flex-1 file:mr-3 file:py-0.5 file:px-2.5 file:rounded-md file:border-0 file:text-[11px] file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                                            />
                                            {isEdit && (
                                                <Button
                                                    type="button"
                                                    onClick={handleUploadDocumentNow}
                                                    disabled={uploadingDoc || !selectedFile}
                                                    className="w-full sm:w-auto h-7.5 sm:h-8 rounded-lg px-3 font-semibold text-xs bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 shadow-2xs cursor-pointer flex items-center justify-center"
                                                >
                                                    {uploadingDoc ? <Loader2 className="size-3.5 animate-spin" /> : <UploadCloud className="size-3.5" />}
                                                    <span>Upload Document</span>
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Documents List */}
                            <div className="bg-card border border-border/60 rounded-xl p-3 sm:p-4 shadow-2xs space-y-2.5 sm:space-y-3">
                                <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5 pb-1.5 border-b border-border/40 justify-between">
                                    <span className="flex items-center gap-1.5">
                                        <FileText className="size-3.5 text-primary" />
                                        Associated Documents ({documents.length})
                                    </span>
                                </h3>

                                {documents.length === 0 ? (
                                    <div className="py-8 text-center text-muted-foreground border-2 border-dashed border-border/50 rounded-lg">
                                        <UploadCloud className="size-8 mx-auto mb-1.5 opacity-30 text-primary" />
                                        <p className="font-semibold text-xs">No documents attached yet.</p>
                                        <p className="text-[11px] text-muted-foreground mt-0.5">
                                            Upload Aadhaar, PAN, GST certificate, agreements, or trade licenses above.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-border/40">
                                        {documents.map((doc: any, i: number) => {
                                            const fileUrl = doc.fileName ? profileService.getDocumentDownloadUrl(doc.fileName) : doc.fileUrl;

                                            return (
                                                <div key={doc._id || i} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 first:pt-0 last:pb-0">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                                                            <FileText className="size-4" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-1.5">
                                                                <p className="font-bold text-xs text-foreground truncate">{doc.title || doc.originalName}</p>
                                                                <span className="px-1.5 py-0.2 rounded-md bg-muted font-bold text-[9.5px] text-muted-foreground shrink-0 border border-border/50">
                                                                    {doc.documentType || "Document"}
                                                                </span>
                                                            </div>
                                                            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                                                                {doc.originalName} • {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : "File"} • Uploaded {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : "recently"}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-1 shrink-0 self-end sm:self-auto">
                                                        {fileUrl && (
                                                            <>
                                                                <a
                                                                    href={fileUrl}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="h-7 px-2 rounded-md border border-border/60 hover:bg-muted text-[11px] font-semibold flex items-center gap-1 transition-colors"
                                                                    title="View Document"
                                                                >
                                                                    <Eye className="size-3 text-primary" />
                                                                    <span>View</span>
                                                                </a>
                                                                <a
                                                                    href={fileUrl}
                                                                    download={doc.originalName || doc.title}
                                                                    className="h-7 px-2 rounded-md border border-border/60 hover:bg-muted text-[11px] font-semibold flex items-center gap-1 transition-colors"
                                                                    title="Download Document"
                                                                >
                                                                    <Download className="size-3 text-primary" />
                                                                    <span>Download</span>
                                                                </a>
                                                            </>
                                                        )}
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDeleteDocNow(doc._id)}
                                                            className="h-7 w-7 p-0 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                                                            title="Delete Document"
                                                        >
                                                            <Trash2 className="size-3.5" />
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
                <div className="p-2.5 sm:px-5 sm:py-3 border-t border-border/60 bg-muted/30 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-2.5 shrink-0">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        className="w-full sm:w-auto h-8 rounded-lg px-4 font-semibold text-xs cursor-pointer"
                        disabled={saving}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSubmit}
                        className="w-full sm:w-auto h-8 rounded-lg px-4.5 font-semibold text-xs bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 cursor-pointer shadow-2xs flex items-center justify-center"
                        disabled={saving}
                    >
                        {saving && <Loader2 className="size-3.5 animate-spin" />}
                        <span>{isEdit ? `Update ${meta.title}` : `Create ${meta.title}`}</span>
                        <ArrowRightIcon className="size-3.5" />
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default ProfileFormModal;
