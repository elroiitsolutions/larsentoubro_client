import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"

export function NotFoundPage() {
    const navigate = useNavigate()

    return (
        <div className="flex min-h-svh w-full flex-col items-center justify-center gap-4 text-center">
            <p className="text-8xl font-bold text-muted-foreground/30">404</p>
            <h1 className="text-2xl font-semibold">Page Not Found</h1>
            <p className="text-muted-foreground text-sm max-w-xs">
                The page you're looking for doesn't exist or has been moved.
            </p>
            <Button onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
        </div>
    )
}
