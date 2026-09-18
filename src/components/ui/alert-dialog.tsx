import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogContext } from "./dialog"
import { Button } from "./button"

export function AlertDialog({
  open,
  onOpenChange,
  children
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
    </Dialog>
  )
}

export function AlertDialogContent({
  children,
  className = ""
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <DialogContent className={`p-6 ${className}`} hideClose={true}>
      {children}
    </DialogContent>
  )
}

export function AlertDialogHeader({
  children,
  className = ""
}: {
  children: React.ReactNode
  className?: string
}) {
  return <DialogHeader className={className}>{children}</DialogHeader>
}

export function AlertDialogTitle({
  children,
  className = ""
}: {
  children: React.ReactNode
  className?: string
}) {
  return <DialogTitle className={className}>{children}</DialogTitle>
}

export function AlertDialogDescription({
  children,
  className = ""
}: {
  children: React.ReactNode
  className?: string
}) {
  return <DialogDescription className={className}>{children}</DialogDescription>
}

export function AlertDialogFooter({
  children,
  className = ""
}: {
  children: React.ReactNode
  className?: string
}) {
  return <DialogFooter className={className}>{children}</DialogFooter>
}

export function AlertDialogAction({
  children,
  onClick,
  disabled = false,
  className = ""
}: {
  children: React.ReactNode
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  disabled?: boolean
  className?: string
}) {
  return (
    <Button onClick={onClick} disabled={disabled} className={className}>
      {children}
    </Button>
  )
}

export function AlertDialogCancel({
  children,
  onClick,
  disabled = false,
  className = ""
}: {
  children?: React.ReactNode
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  disabled?: boolean
  className?: string
}) {
  const { onOpenChange } = React.useContext(DialogContext)

  return (
    <Button
      variant="outline"
      disabled={disabled}
      onClick={(e) => {
        if (onClick) onClick(e)
        onOpenChange(false)
      }}
      className={className}
    >
      {children || "Cancel"}
    </Button>
  )
}
