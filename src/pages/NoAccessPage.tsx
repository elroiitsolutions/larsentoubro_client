import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ShieldAlertIcon, LockIcon, ArrowLeftIcon } from "lucide-react"

export function NoAccessPage() {
    const navigate = useNavigate()

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 text-center p-6 mx-auto max-w-lg">
            <div className="p-5 rounded-3xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shadow-md">
                <ShieldAlertIcon className="size-16" />
            </div>
            <div className="space-y-2">
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center justify-center gap-2">
                    <LockIcon className="size-6 text-rose-500" />
                    Access Denied
                </h1>
                <p className="text-muted-foreground text-sm max-w-md leading-relaxed">
                    You do not have permission to view or interact with this page. This restriction is enforced by L&T Platform security. Please contact your system Administrator if you require access.
                </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
                <Button
                    onClick={() => navigate("/dashboard")}
                    className="h-11 rounded-xl px-6 font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm gap-2 cursor-pointer"
                >
                    <ArrowLeftIcon className="size-4" />
                    Return to Dashboard
                </Button>
            </div>
        </div>
    )
}

export default NoAccessPage;
