import { useState, useEffect, useMemo } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    CheckCircle2,
    XCircle,
    Wrench,
    Archive,
    Loader2,
    ArrowLeft,
    Calendar,
    ClipboardCheck,
    AlertTriangle,
    ShieldCheck,
    Layers
} from "lucide-react"
import { toast } from "sonner"
import toolService, { type ToolRecord } from "@/services/tool.service"
import formService from "@/services/form.service"
import { useAuth } from "@/contexts/AuthContext"

interface ToolInspectionModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    selectedTools: ToolRecord[]
    onSuccess: () => void
}

type StepType = "SELECT_RESULT" | "PASS_CONFIG" | "FAIL_OPTIONS"

export function ToolInspectionModal({
    open,
    onOpenChange,
    selectedTools,
    onSuccess
}: ToolInspectionModalProps) {
    const { user } = useAuth()
    const [step, setStep] = useState<StepType>("SELECT_RESULT")
    const [submitting, setSubmitting] = useState(false)
    const [loadingConfig, setLoadingConfig] = useState(false)

    // Form inputs
    const [validationOptions, setValidationOptions] = useState<string[]>([
        "1 Year",
        "2 Years",
        "3 Years"
    ])
    const [selectedValidation, setSelectedValidation] = useState<string>("1 Year")
    const [failAction, setFailAction] = useState<"Repair" | "Scrap">("Repair")
    const [remarks, setRemarks] = useState("")

    // Reset and fetch form configuration on modal open
    useEffect(() => {
        if (!open) {
            setStep("SELECT_RESULT")
            setRemarks("")
            setFailAction("Repair")
            return
        }

        const fetchValidationOptions = async () => {
            setLoadingConfig(true)
            try {
                const res = await formService.getFormBySlug("tool-form")
                if (res?.success && res.data?.fields) {
                    const valField = res.data.fields.find(
                        (f: any) => f.name === "validation" || f.id === "validation"
                    )
                    if (valField && Array.isArray(valField.options) && valField.options.length > 0) {
                        const opts = valField.options.map((o: any) => o.label || o.value || String(o))
                        setValidationOptions(opts)
                        if (opts.length > 0) {
                            setSelectedValidation(opts[0])
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to load validation options from form configuration:", err)
            } finally {
                setLoadingConfig(false)
            }
        }

        fetchValidationOptions()

        // Set default validation from first selected tool if available
        if (selectedTools.length === 1 && selectedTools[0].validityPeriod) {
            const raw = selectedTools[0].validityPeriod
            if (raw && raw !== "N/A" && raw !== "-") {
                setSelectedValidation(raw)
            }
        }
    }, [open, selectedTools])

    // Compute live expiry preview for the tool(s)
    const expiryPreview = useMemo(() => {
        if (!selectedValidation) return null
        const yearsMatch = selectedValidation.match(/(\d+)/)
        const years = yearsMatch ? parseInt(yearsMatch[1], 10) : 1

        if (selectedTools.length === 0) return null
        const sampleTool = selectedTools[0]

        // Parse flexible date
        const parseDate = (val?: any): Date => {
            if (!val) return new Date()
            const str = String(val).trim()
            const parts = str.split(/[\/\-\.]/)
            if (parts.length === 3) {
                const p0 = parseInt(parts[0], 10)
                const p1 = parseInt(parts[1], 10)
                const p2 = parseInt(parts[2], 10)
                if (p0 >= 1970 && p0 <= 2100) return new Date(p0, p1 - 1, p2)
                if (p2 >= 1970 && p2 <= 2100) {
                    if (p0 > 12) return new Date(p2, p1 - 1, p0)
                    return new Date(p2, p1 - 1, p0)
                }
            }
            const fallback = new Date(str)
            return isNaN(fallback.getTime()) ? new Date() : fallback
        }

        const startDate = parseDate(
            sampleTool.dateOfSupply || sampleTool.createdAt
        )
        const computed = new Date(startDate)
        computed.setFullYear(computed.getFullYear() + years)

        const mm = String(computed.getMonth() + 1).padStart(2, "0")
        const dd = String(computed.getDate()).padStart(2, "0")
        const yyyy = computed.getFullYear()
        return `${mm}/${dd}/${yyyy}`
    }, [selectedValidation, selectedTools])

    const handleConfirmPass = async () => {
        if (!selectedValidation) {
            toast.error("Please select a valid validation period")
            return
        }

        setSubmitting(true)
        try {
            const toolIds = selectedTools.map(t => t._id)
            const res = await toolService.inspectTools({
                toolIds,
                result: "Pass",
                action: "Pass",
                validation: selectedValidation,
                remarks: remarks.trim()
            })

            if (res.success) {
                toast.success(
                    res.message || `Successfully marked ${toolIds.length} tool(s) as Passed`
                )
                onSuccess()
                onOpenChange(false)
            } else {
                toast.error(res.message || "Failed to submit inspection pass")
            }
        } catch (error: any) {
            console.error("Inspection pass error:", error)
            toast.error(
                error?.response?.data?.message ||
                error.message ||
                "Failed to submit inspection pass"
            )
        } finally {
            setSubmitting(false)
        }
    }

    const handleConfirmFail = async () => {
        setSubmitting(true)
        try {
            const toolIds = selectedTools.map(t => t._id)
            const res = await toolService.inspectTools({
                toolIds,
                result: "Fail",
                action: failAction,
                remarks: remarks.trim()
            })

            if (res.success) {
                toast.success(
                    res.message ||
                    (failAction === "Repair"
                        ? `Marked ${toolIds.length} tool(s) for Repair`
                        : `Moved ${toolIds.length} tool(s) to Scrap`)
                )
                onSuccess()
                onOpenChange(false)
            } else {
                toast.error(res.message || "Failed to submit inspection outcome")
            }
        } catch (error: any) {
            console.error("Inspection fail error:", error)
            toast.error(
                error?.response?.data?.message ||
                error.message ||
                "Failed to submit inspection outcome"
            )
        } finally {
            setSubmitting(false)
        }
    }

    const totalSelected = selectedTools.length

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md sm:max-w-xl rounded-2xl border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl p-6">
                {/* STEP 1: SELECT RESULT (PASS / FAIL) */}
                {step === "SELECT_RESULT" && (
                    <div className="space-y-5 animate-in fade-in duration-200">
                        <DialogHeader>
                            <div className="flex items-center gap-2.5">
                                <div className="size-10 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                    <ClipboardCheck className="size-5" />
                                </div>
                                <div>
                                    <DialogTitle className="text-xl font-bold tracking-tight">
                                        Tool Quality Inspection
                                    </DialogTitle>
                                    <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                                        Perform quality and safety verification for {totalSelected} selected tool{totalSelected === 1 ? "" : "s"}.
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>

                        {/* Selected Tools Quick Chips */}
                        <div className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-1.5">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span className="font-semibold text-foreground flex items-center gap-1.5">
                                    <Layers className="size-3.5 text-primary" />
                                    Selected for Inspection ({totalSelected})
                                </span>
                                <span>Inspector: {user?.name || "Quality Team"}</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-1">
                                {selectedTools.map(t => (
                                    <span
                                        key={t._id}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-mono bg-background border border-border/70 text-foreground"
                                        title={`${t.toolId} - ${t.description}`}
                                    >
                                        <span className="font-bold">{t.toolId || t.toolCode || "Tool"}</span>
                                        <span className="text-muted-foreground text-[10px] truncate max-w-[120px]">
                                            ({t.description})
                                        </span>
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Two Primary Action Cards: Pass or Fail */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                            {/* Pass Card */}
                            <button
                                type="button"
                                onClick={() => setStep("PASS_CONFIG")}
                                className="flex flex-col items-start text-left p-4 rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500 transition-all cursor-pointer group shadow-xs"
                            >
                                <div className="flex items-center justify-between w-full mb-2.5">
                                    <div className="size-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                                        <CheckCircle2 className="size-5" />
                                    </div>
                                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                                        Pass
                                    </span>
                                </div>
                                <h4 className="text-sm font-bold text-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                                    Mark as PASS
                                </h4>
                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                    Tools meet safety specifications. Proceed to configure Validation Period (1, 2, or 3 Years) and renew expiry date.
                                </p>
                            </button>

                            {/* Fail Card */}
                            <button
                                type="button"
                                onClick={() => setStep("FAIL_OPTIONS")}
                                className="flex flex-col items-start text-left p-4 rounded-2xl border-2 border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10 hover:border-rose-500 transition-all cursor-pointer group shadow-xs"
                            >
                                <div className="flex items-center justify-between w-full mb-2.5">
                                    <div className="size-9 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                                        <XCircle className="size-5" />
                                    </div>
                                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                                        Fail
                                    </span>
                                </div>
                                <h4 className="text-sm font-bold text-foreground group-hover:text-rose-700 dark:group-hover:text-rose-400 transition-colors">
                                    Mark as FAIL
                                </h4>
                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                    Tools failed inspection or show defects. Route for internal/external Repair or move directly to Scrap page.
                                </p>
                            </button>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                className="w-full sm:w-auto rounded-xl"
                            >
                                Cancel
                            </Button>
                        </DialogFooter>
                    </div>
                )}

                {/* STEP 2A: PASS CONFIGURATION */}
                {step === "PASS_CONFIG" && (
                    <div className="space-y-4 animate-in slide-in-from-right-3 duration-200">
                        <DialogHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setStep("SELECT_RESULT")}
                                        className="size-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                                        title="Back to result selection"
                                    >
                                        <ArrowLeft className="size-4" />
                                    </button>
                                    <DialogTitle className="text-lg font-bold flex items-center gap-2">
                                        <CheckCircle2 className="size-5 text-emerald-600" />
                                        <span>Inspection Passed — Update Validation</span>
                                    </DialogTitle>
                                </div>
                                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                                    {totalSelected} Tool{totalSelected === 1 ? "" : "s"}
                                </span>
                            </div>
                            <DialogDescription className="text-xs text-muted-foreground pt-1">
                                Select the renewed validity period. The expiration date will automatically compute from the date of supply.
                            </DialogDescription>
                        </DialogHeader>

                        {/* Validation Dropdown Section */}
                        <div className="space-y-1.5 p-3.5 rounded-xl border border-border/60 bg-muted/20">
                            <label className="text-xs font-bold text-foreground flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                    <ShieldCheck className="size-3.5 text-emerald-600" />
                                    Validation Period (Configured in Form Management)
                                </span>
                                {loadingConfig && <Loader2 className="size-3 animate-spin text-muted-foreground" />}
                            </label>
                            <Select value={selectedValidation} onValueChange={(val) => setSelectedValidation(val || "")}>
                                <SelectTrigger className="h-10 rounded-xl bg-background border-border/80 text-xs font-medium">
                                    <SelectValue placeholder="Select validation period..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    {validationOptions.map((opt) => (
                                        <SelectItem key={opt} value={opt} className="text-xs font-medium">
                                            {opt}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-[11px] text-muted-foreground">
                                Options are populated dynamically from Form Management configuration.
                            </p>
                        </div>

                        {/* Live Expiry Preview Banner */}
                        {expiryPreview && (
                            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                                    <Calendar className="size-4 shrink-0 text-emerald-600" />
                                    <div>
                                        <span className="font-semibold block text-[11px] uppercase tracking-wide">
                                            Calculated Expiry Date
                                        </span>
                                        <span className="font-bold font-mono text-sm">
                                            {expiryPreview}
                                        </span>
                                    </div>
                                </div>
                                <span className="text-[10px] text-emerald-600 font-medium">
                                    Based on {selectedValidation}
                                </span>
                            </div>
                        )}

                        {/* Optional Inspection Remarks */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-foreground block">
                                Inspection Remarks & Notes (Optional)
                            </label>
                            <Textarea
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                placeholder="e.g. Visual inspection passed, tested load capacity, calibrated sensors..."
                                className="min-h-[70px] text-xs rounded-xl resize-none"
                            />
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0 pt-2">
                            <Button
                                variant="outline"
                                onClick={() => setStep("SELECT_RESULT")}
                                disabled={submitting}
                                className="rounded-xl"
                            >
                                Back
                            </Button>
                            <Button
                                onClick={handleConfirmPass}
                                disabled={submitting}
                                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md"
                            >
                                {submitting && <Loader2 className="size-4 animate-spin mr-2" />}
                                Confirm Pass ({totalSelected})
                            </Button>
                        </DialogFooter>
                    </div>
                )}

                {/* STEP 2B: FAIL CONFIGURATION (REPAIR OR SCRAP) */}
                {step === "FAIL_OPTIONS" && (
                    <div className="space-y-4 animate-in slide-in-from-right-3 duration-200">
                        <DialogHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setStep("SELECT_RESULT")}
                                        className="size-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                                        title="Back to result selection"
                                    >
                                        <ArrowLeft className="size-4" />
                                    </button>
                                    <DialogTitle className="text-lg font-bold flex items-center gap-2">
                                        <XCircle className="size-5 text-rose-600" />
                                        <span>Inspection Failed — Select Action</span>
                                    </DialogTitle>
                                </div>
                                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                                    {totalSelected} Tool{totalSelected === 1 ? "" : "s"}
                                </span>
                            </div>
                            <DialogDescription className="text-xs text-muted-foreground pt-1">
                                Choose whether to send the failed tool(s) for Repair or move directly to Scrap.
                            </DialogDescription>
                        </DialogHeader>

                        {/* Radio selection between Repair and Scrap */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            {/* Option: Repair */}
                            <div
                                onClick={() => setFailAction("Repair")}
                                className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                                    failAction === "Repair"
                                        ? "bg-amber-500/10 border-amber-500 text-foreground shadow-sm"
                                        : "bg-muted/30 border-border/70 text-muted-foreground hover:border-border"
                                }`}
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="size-8 rounded-lg bg-amber-500/15 text-amber-600 flex items-center justify-center">
                                            <Wrench className="size-4" />
                                        </div>
                                        <div className={`size-4 rounded-full border flex items-center justify-center ${
                                            failAction === "Repair" ? "border-amber-500 bg-amber-500" : "border-border"
                                        }`}>
                                            {failAction === "Repair" && <div className="size-1.5 rounded-full bg-white" />}
                                        </div>
                                    </div>
                                    <h4 className="text-xs font-bold text-foreground">
                                        Send to Repair
                                    </h4>
                                    <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                                        Sets status to <strong>Repair</strong>. Tool operations (DC issuance, transfers, returns) are restricted until repaired.
                                    </p>
                                </div>
                            </div>

                            {/* Option: Scrap */}
                            <div
                                onClick={() => setFailAction("Scrap")}
                                className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                                    failAction === "Scrap"
                                        ? "bg-rose-500/10 border-rose-500 text-foreground shadow-sm"
                                        : "bg-muted/30 border-border/70 text-muted-foreground hover:border-border"
                                }`}
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="size-8 rounded-lg bg-rose-500/15 text-rose-600 flex items-center justify-center">
                                            <Archive className="size-4" />
                                        </div>
                                        <div className={`size-4 rounded-full border flex items-center justify-center ${
                                            failAction === "Scrap" ? "border-rose-500 bg-rose-500" : "border-border"
                                        }`}>
                                            {failAction === "Scrap" && <div className="size-1.5 rounded-full bg-white" />}
                                        </div>
                                    </div>
                                    <h4 className="text-xs font-bold text-foreground">
                                        Move to Scrap
                                    </h4>
                                    <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                                        Moves tools directly to the <strong>Scrap page</strong> for future disposal DC generation with Scrap Dealers.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Defect Notes & Reason */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                <AlertTriangle className="size-3.5 text-amber-500" />
                                Defect Reason / Failure Notes
                            </label>
                            <Textarea
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                placeholder={
                                    failAction === "Repair"
                                        ? "Specify defect details, required repairs, or vendor servicing notes..."
                                        : "Specify scrap reason (e.g. beyond economical repair, structural damage)..."
                                }
                                className="min-h-[75px] text-xs rounded-xl resize-none"
                            />
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0 pt-2">
                            <Button
                                variant="outline"
                                onClick={() => setStep("SELECT_RESULT")}
                                disabled={submitting}
                                className="rounded-xl"
                            >
                                Back
                            </Button>
                            <Button
                                onClick={handleConfirmFail}
                                disabled={submitting}
                                className={`rounded-xl font-semibold text-white shadow-md ${
                                    failAction === "Repair"
                                        ? "bg-amber-600 hover:bg-amber-700"
                                        : "bg-rose-600 hover:bg-rose-700"
                                }`}
                            >
                                {submitting && <Loader2 className="size-4 animate-spin mr-2" />}
                                {failAction === "Repair"
                                    ? `Confirm Repair (${totalSelected})`
                                    : `Confirm Move to Scrap (${totalSelected})`}
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}

export default ToolInspectionModal
