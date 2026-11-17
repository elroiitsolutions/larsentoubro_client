import { useState, useEffect, useRef, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import {
    Bell,
    CheckCircle2,
    Clock,
    X,
    RotateCw,
    ChevronRight,
    ShieldAlert,
    Calendar,
    ArrowRight
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogAction,
    AlertDialogCancel
} from "@/components/ui/alert-dialog"
import guestUserService, {
    type GuestUserRecord,
    type ExtensionDuration
} from "@/services/guestUser.service"
import { useAuth } from "@/contexts/AuthContext"

const EXTENSION_DURATIONS: { label: ExtensionDuration; description: string }[] = [
    { label: "15 days", description: "Standard 15-day extension" },
    { label: "45 days", description: "Extended 45-day validity" },
    { label: "1 month", description: "30-day site access" },
    { label: "3 months", description: "Quarterly inspection access" },
    { label: "6 months", description: "Long-term contractor access" }
]

export function NotificationBell() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [isOpen, setIsOpen] = useState(false)
    const [expiringGuests, setExpiringGuests] = useState<GuestUserRecord[]>([])
    const [loading, setLoading] = useState(false)

    // Inline extension state: { [guestId]: selectedDuration }
    const [extendingGuestId, setExtendingGuestId] = useState<string | null>(null)
    const [selectedDuration, setSelectedDuration] = useState<ExtensionDuration>("15 days")
    const [actionLoading, setActionLoading] = useState(false)

    // Rejection confirmation dialog state
    const [guestToReject, setGuestToReject] = useState<GuestUserRecord | null>(null)

    const popoverRef = useRef<HTMLDivElement>(null)
    const bellButtonRef = useRef<HTMLButtonElement>(null)

    // Check if the current user has permission to manage sub-users/guests
    const canManageGuests = user?.role === "Admin" || Boolean(user?.canCreateUser)

    // Fetch expiring guest notifications
    const loadExpiringNotifications = useCallback(async (showSpinner = false) => {
        if (!canManageGuests) return
        if (showSpinner) setLoading(true)
        try {
            const res = await guestUserService.getExpiringNotifications()
            if (res.success && Array.isArray(res.data)) {
                setExpiringGuests(res.data)
            }
        } catch (error) {
            console.error("[NotificationBell] Failed to fetch guest expiry alerts:", error)
        } finally {
            if (showSpinner) setLoading(false)
        }
    }, [canManageGuests])

    // Initial load + periodic poll every 45 seconds
    useEffect(() => {
        if (!canManageGuests) return
        loadExpiringNotifications()
        const interval = setInterval(() => {
            loadExpiringNotifications()
        }, 45000)
        return () => clearInterval(interval)
    }, [canManageGuests, loadExpiringNotifications])

    // Refresh when popover opens
    useEffect(() => {
        if (isOpen && canManageGuests) {
            loadExpiringNotifications(true)
        }
    }, [isOpen, canManageGuests, loadExpiringNotifications])

    // Close on outside click or Escape key
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                popoverRef.current &&
                !popoverRef.current.contains(event.target as Node) &&
                bellButtonRef.current &&
                !bellButtonRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false)
                setExtendingGuestId(null)
            }
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setIsOpen(false)
                setExtendingGuestId(null)
            }
        }

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside)
            document.addEventListener("keydown", handleKeyDown)
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
            document.removeEventListener("keydown", handleKeyDown)
        }
    }, [isOpen])

    // Handle Confirm Extension
    const handleConfirmExtension = async (guest: GuestUserRecord) => {
        setActionLoading(true)
        try {
            const res = await guestUserService.extendGuestUser(guest._id, selectedDuration)
            if (res.success) {
                toast.success(
                    `Access extended for ${guest.name} by ${selectedDuration}!`
                )
                // Remove from local list immediately
                setExpiringGuests((prev) => prev.filter((g) => g._id !== guest._id))
                setExtendingGuestId(null)
                // Trigger refresh
                loadExpiringNotifications()
            }
        } catch (err: any) {
            const msg = err?.response?.data?.message || err.message || "Failed to extend access"
            toast.error(msg)
        } finally {
            setActionLoading(false)
        }
    }

    // Handle Reject Extension
    const handleConfirmReject = async () => {
        if (!guestToReject) return
        setActionLoading(true)
        try {
            const res = await guestUserService.rejectGuestUser(
                guestToReject._id,
                "Rejected by administrator via notification center"
            )
            if (res.success) {
                toast.warning(`Guest account for ${guestToReject.name} has been expired.`)
                setExpiringGuests((prev) => prev.filter((g) => g._id !== guestToReject._id))
                setGuestToReject(null)
                loadExpiringNotifications()
            }
        } catch (err: any) {
            const msg = err?.response?.data?.message || err.message || "Failed to reject extension"
            toast.error(msg)
        } finally {
            setActionLoading(false)
        }
    }

    // If user has no permission to view guest notifications, don't display bell
    if (!canManageGuests) {
        return null
    }

    const unreadCount = expiringGuests.length

    return (
        <div className="relative">
            {/* Top-Right Notification Bell Trigger Button */}
            <button
                ref={bellButtonRef}
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className={cn(
                    "relative size-9 flex items-center justify-center rounded-xl text-foreground/80 hover:text-foreground hover:bg-muted/70 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40",
                    isOpen && "bg-muted text-primary ring-2 ring-primary/20"
                )}
                aria-label="View guest expiry notifications"
                title="Guest Expiry Notifications"
            >
                <Bell className="size-5 transition-transform duration-200 hover:rotate-6" />

                {/* Unread Expiry Count Badge */}
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-amber-600 text-[10px] font-black text-white shadow-md ring-2 ring-background animate-pulse">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Notification Popover Dropdown Panel */}
            {isOpen && (
                <div
                    ref={popoverRef}
                    className="absolute right-0 top-full mt-2.5 w-[380px] sm:w-[440px] max-w-[calc(100vw-1.5rem)] rounded-2xl border border-border/80 bg-background/95 backdrop-blur-xl shadow-2xl z-50 overflow-hidden flex flex-col animate-in fade-in-0 zoom-in-95 duration-200"
                    style={{ maxHeight: "calc(100vh - 5rem)" }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3.5 border-b border-border/60 bg-muted/30">
                        <div className="flex items-center gap-2">
                            <div className="size-7 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
                                <Clock className="size-4" />
                            </div>
                            <div className="flex flex-col">
                                <h3 className="font-bold text-sm text-foreground tracking-tight leading-none">
                                    Notifications
                                </h3>
                                <span className="text-[10px] text-muted-foreground mt-0.5">
                                    14th-Day Guest Expiry Alerts
                                </span>
                            </div>
                        </div>

                        {/* Top-Right Header Actions */}
                        <div className="flex items-center gap-1">
                            {unreadCount > 0 && (
                                <span className="rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[11px] font-bold px-2.5 py-0.5 border border-amber-500/25">
                                    {unreadCount} Expiring Soon
                                </span>
                            )}

                            <button
                                type="button"
                                onClick={() => loadExpiringNotifications(true)}
                                title="Refresh alerts"
                                disabled={loading}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                            >
                                <RotateCw className={cn("size-4", loading && "animate-spin text-primary")} />
                            </button>

                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer ml-0.5"
                            >
                                <X className="size-4" />
                            </button>
                        </div>
                    </div>

                    {/* Scrollable Expiring Guests List */}
                    <div className="overflow-y-auto max-h-[460px] divide-y divide-border/40 overscroll-contain">
                        {loading && expiringGuests.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                                <RotateCw className="size-6 animate-spin text-primary" />
                                <span className="text-xs font-medium">Checking guest user expiry statuses...</span>
                            </div>
                        ) : expiringGuests.length === 0 ? (
                            /* Empty State */
                            <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
                                <div className="size-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-2.5 shadow-inner">
                                    <CheckCircle2 className="size-6" />
                                </div>
                                <h4 className="font-bold text-sm text-foreground">
                                    No Pending Expiry Alerts
                                </h4>
                                <p className="text-xs text-muted-foreground mt-1 max-w-[260px] leading-relaxed">
                                    All guest user accounts have valid access. On the 14th day of any guest&apos;s
                                    15-day period, an expiry notification will appear here for extension or rejection.
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setIsOpen(false)
                                        navigate("/settings/guest-users")
                                    }}
                                    className="mt-4 text-xs font-semibold h-8 rounded-lg"
                                >
                                    Manage Guest Users
                                    <ChevronRight className="size-3.5 ml-1" />
                                </Button>
                            </div>
                        ) : (
                            /* Guest Expiry Notification Cards */
                            expiringGuests.map((guest) => {
                                const isExpanding = extendingGuestId === guest._id
                                const hoursLeft = guest.hoursRemaining ?? 24
                                const daysLeft = guest.daysRemaining ?? 1
                                const isExpired = Boolean(guest.isExpired)

                                return (
                                    <div
                                        key={guest._id}
                                        className={cn(
                                            "p-4 transition-all duration-150 flex flex-col gap-2.5 hover:bg-muted/30",
                                            isExpired
                                                ? "bg-rose-500/[0.04] border-l-4 border-l-rose-500"
                                                : "bg-amber-500/[0.04] border-l-4 border-l-amber-500"
                                        )}
                                    >
                                        {/* Card Top Row */}
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div
                                                    className={cn(
                                                        "size-8 rounded-lg flex items-center justify-center shrink-0 border",
                                                        isExpired
                                                            ? "bg-rose-500/15 text-rose-600 border-rose-500/30"
                                                            : "bg-amber-500/15 text-amber-600 border-amber-500/30"
                                                    )}
                                                >
                                                    {isExpired ? (
                                                        <ShieldAlert className="size-4" />
                                                    ) : (
                                                        <Clock className="size-4" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="font-bold text-sm text-foreground truncate">
                                                        {guest.name}
                                                    </h4>
                                                    <span className="text-xs text-muted-foreground font-mono">
                                                        {guest.formattedPhone || `+91 ${guest.phone}`}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Expiry Pill */}
                                            <div className="shrink-0 text-right">
                                                <span
                                                    className={cn(
                                                        "text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 border",
                                                        isExpired
                                                            ? "bg-rose-500/15 text-rose-600 border-rose-500/30"
                                                            : "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30"
                                                    )}
                                                >
                                                    {isExpired
                                                        ? "Expired"
                                                        : daysLeft <= 1
                                                        ? `Expires in ${hoursLeft}h (Day 14)`
                                                        : `Expires in ${daysLeft} days`}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Description & Metadata */}
                                        <div className="text-xs text-muted-foreground space-y-0.5 bg-muted/40 p-2 rounded-lg border border-border/40">
                                            {guest.organization && (
                                                <div className="flex items-center justify-between text-[11px]">
                                                    <span className="text-muted-foreground">Firm:</span>
                                                    <span className="font-medium text-foreground truncate max-w-[200px]">
                                                        {guest.organization}
                                                    </span>
                                                </div>
                                            )}
                                            {guest.purpose && (
                                                <div className="flex items-center justify-between text-[11px]">
                                                    <span className="text-muted-foreground">Purpose:</span>
                                                    <span className="font-medium text-foreground truncate max-w-[200px]">
                                                        {guest.purpose}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex items-center justify-between text-[11px] pt-0.5 border-t border-border/30">
                                                <span className="text-muted-foreground">Created by:</span>
                                                <span className="font-medium text-foreground">
                                                    {guest.createdBy?.name || "Administrator"} ({guest.createdBy?.role || "Admin"})
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-[11px]">
                                                <span className="text-muted-foreground">Valid until:</span>
                                                <span className="font-medium text-foreground">
                                                    {new Date(guest.expiresAt).toLocaleDateString(undefined, {
                                                        month: "short",
                                                        day: "numeric",
                                                        year: "numeric"
                                                    })}{" "}
                                                    at{" "}
                                                    {new Date(guest.expiresAt).toLocaleTimeString(undefined, {
                                                        hour: "2-digit",
                                                        minute: "2-digit"
                                                    })}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Interactive Duration Picker (When Confirm Extension is clicked) */}
                                        {isExpanding ? (
                                            <div className="p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 space-y-2 animate-in fade-in-0 duration-150">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                                                        <Calendar className="size-3.5" />
                                                        Select Extension Duration:
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setExtendingGuestId(null)}
                                                        className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                                                    {EXTENSION_DURATIONS.map((dur) => (
                                                        <button
                                                            key={dur.label}
                                                            type="button"
                                                            onClick={() => setSelectedDuration(dur.label)}
                                                            className={cn(
                                                                "py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all text-center cursor-pointer",
                                                                selectedDuration === dur.label
                                                                    ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                                                                    : "bg-background/80 text-foreground border-border hover:bg-background"
                                                            )}
                                                        >
                                                            {dur.label}
                                                        </button>
                                                    ))}
                                                </div>

                                                <div className="flex items-center justify-end gap-2 pt-1">
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => setExtendingGuestId(null)}
                                                        disabled={actionLoading}
                                                        className="h-8 text-xs cursor-pointer"
                                                    >
                                                        Cancel
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        onClick={() => handleConfirmExtension(guest)}
                                                        disabled={actionLoading}
                                                        className="h-8 text-xs font-bold bg-emerald-700 hover:bg-emerald-600 text-white cursor-pointer"
                                                    >
                                                        {actionLoading ? "Updating..." : `Extend for ${selectedDuration}`}
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            /* Primary Action Buttons */
                                            <div className="flex items-center justify-between gap-2 pt-1">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setGuestToReject(guest)}
                                                    className="h-8 text-xs text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/50 font-semibold cursor-pointer"
                                                >
                                                    Reject Extension
                                                </Button>

                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    onClick={() => {
                                                        setExtendingGuestId(guest._id)
                                                        setSelectedDuration("15 days")
                                                    }}
                                                    className="h-8 text-xs font-bold bg-emerald-700 hover:bg-emerald-600 text-white shadow-xs cursor-pointer flex items-center gap-1.5"
                                                >
                                                    Confirm Extension
                                                    <ArrowRight className="size-3.5" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )
                            })
                        )}
                    </div>

                    {/* Popover Footer */}
                    <div className="px-4 py-2.5 border-t border-border/50 bg-muted/20 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>
                            {expiringGuests.length > 0
                                ? `${expiringGuests.length} account${expiringGuests.length === 1 ? "" : "s"} requiring review`
                                : "Guest Access Monitored"}
                        </span>
                        <button
                            type="button"
                            onClick={() => {
                                setIsOpen(false)
                                navigate("/settings/guest-users")
                            }}
                            className="font-semibold text-primary hover:underline cursor-pointer flex items-center gap-1"
                        >
                            Open Guest Management
                            <ChevronRight className="size-3" />
                        </button>
                    </div>
                </div>
            )}

            {/* CONFIRMATION DIALOG: REJECT EXTENSION */}
            <AlertDialog
                open={Boolean(guestToReject)}
                onOpenChange={(open) => {
                    if (!open) setGuestToReject(null)
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Reject Guest Access Extension?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to reject the access extension for{" "}
                            <strong>{guestToReject?.name}</strong> (+91 {guestToReject?.phone})?
                            <br />
                            <br />
                            The guest account will be immediately marked as <strong>Expired</strong>, and the user
                            will be restricted from requesting OTPs or logging into the equipment scanner.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"                            onClick={handleConfirmReject}
                            disabled={actionLoading}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-semibold cursor-pointer"
                        >
                            {actionLoading ? "Rejecting..." : "Reject & Expire Account"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

export default NotificationBell

