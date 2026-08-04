import * as React from "react"
import { X } from "lucide-react"

export function Dialog({ open, onOpenChange, children, className = "" }: { open: boolean; onOpenChange: (open: boolean) => void; children: React.ReactNode; className?: string }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
      <div className={`relative z-50 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-border/80 bg-background shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 rounded-2xl ${className}`}>
        {children}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-full p-1.5 opacity-70 ring-offset-background transition-opacity hover:opacity-100 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-20 cursor-pointer"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      </div>
    </div>
  );
}

export function DialogContent({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return <div className={`flex flex-col flex-1 min-h-0 overflow-hidden w-full ${className}`}>{children}</div>
}

export function DialogHeader({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return <div className={`flex flex-col space-y-1 text-left ${className}`}>{children}</div>
}

export function DialogTitle({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return <h2 className={`text-lg font-bold leading-none tracking-tight text-foreground ${className}`}>{children}</h2>
}

export function DialogDescription({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return <p className={`text-xs text-muted-foreground ${className}`}>{children}</p>
}

export function DialogFooter({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return <div className={`flex items-center justify-end gap-2 ${className}`}>{children}</div>
}

