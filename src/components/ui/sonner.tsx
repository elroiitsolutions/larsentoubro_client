import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CheckCircle2Icon, AlertTriangleIcon, AlertCircleIcon, InfoIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ position = "bottom-right", duration = 4000, ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position={position}
      duration={duration}
      richColors
      closeButton
      className="toaster group"
      icons={{
        success: (
          <CheckCircle2Icon className="size-4 text-emerald-500" />
        ),
        info: (
          <InfoIcon className="size-4 text-blue-500" />
        ),
        warning: (
          <AlertTriangleIcon className="size-4 text-amber-500" />
        ),
        error: (
          <AlertCircleIcon className="size-4 text-rose-500" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin text-primary" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast font-sans rounded-xl shadow-lg border border-border/80 text-xs font-medium",
          description: "text-muted-foreground text-[11px]",
          actionButton: "bg-primary text-primary-foreground font-semibold text-xs rounded-lg px-3 py-1.5",
          cancelButton: "bg-muted text-muted-foreground font-semibold text-xs rounded-lg px-3 py-1.5",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
