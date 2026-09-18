import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  className?: string
}

export const DialogContext = React.createContext<{ onOpenChange: (open: boolean) => void }>({
  onOpenChange: () => {},
})

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null

  return (
    <DialogContext.Provider value={{ onOpenChange }}>
      <div 
        className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in-0 duration-200"
        onClick={() => onOpenChange(false)}
      >
        {children}
      </div>
    </DialogContext.Provider>
  )
}

export function DialogContent({ 
  children, 
  className = "",
  hideClose = false 
}: { 
  children: React.ReactNode
  className?: string
  hideClose?: boolean 
}) {
  const { onOpenChange } = React.useContext(DialogContext)

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "relative z-50 w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden border border-border/80 bg-background shadow-2xl rounded-2xl animate-in zoom-in-95 duration-200",
        className
      )}
    >
      {children}
      {!hideClose && (
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-full p-1.5 opacity-70 transition-opacity hover:opacity-100 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring z-20 cursor-pointer text-muted-foreground"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      )}
    </div>
  )
}

export function DialogHeader({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex flex-col space-y-1 text-left", className)}>{children}</div>
}

export function DialogTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <h2 className={cn("text-lg font-bold leading-none tracking-tight text-foreground", className)}>{children}</h2>
}

export function DialogDescription({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("text-xs text-muted-foreground", className)}>{children}</p>
}

export function DialogFooter({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex items-center justify-end gap-2", className)}>{children}</div>
}
