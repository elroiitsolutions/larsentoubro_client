import { useState } from "react"
import { AlertTriangle, Loader2 } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface ConfirmDialogProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => Promise<void> | void
    title?: string
    description?: string
    confirmText?: string
    cancelText?: string
    variant?: "destructive" | "primary" | "warning"
}

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title = "Are you sure?",
    description = "This action cannot be undone.",
    confirmText = "Delete",
    cancelText = "Cancel",
    variant = "destructive",
}: ConfirmDialogProps) {
    const [loading, setLoading] = useState(false)

    const handleConfirm = async () => {
        setLoading(true)
        try {
            await onConfirm()
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
            onClose()
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && !loading && onClose()}>
            <DialogContent className="max-w-[380px] p-4 sm:p-5 space-y-3 shadow-2xl border-border/80 bg-background rounded-xl">
                <DialogHeader className="flex flex-col items-center text-center space-y-2 pt-0.5">
                    <div className="mx-auto size-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center ring-4 ring-destructive/5 mb-0.5 shrink-0">
                        <AlertTriangle className="size-5 text-destructive" />
                    </div>
                    <DialogTitle className="text-sm sm:text-base font-bold text-foreground text-center tracking-tight">
                        {title}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground text-center leading-relaxed px-1">
                        {description}
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="grid grid-cols-2 gap-2.5 pt-3 border-t border-border/50 mt-1">
                    <Button
                        type="button"
                        variant="outline"
                        disabled={loading}
                        onClick={onClose}
                        className="rounded-lg h-8 text-xs font-semibold hover:bg-muted/60 cursor-pointer"
                    >
                        {cancelText}
                    </Button>
                    <Button
                        type="button"
                        variant={variant === "destructive" ? "destructive" : "default"}
                        disabled={loading}
                        onClick={handleConfirm}
                        className="rounded-lg h-8 text-xs font-semibold shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                            confirmText
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
